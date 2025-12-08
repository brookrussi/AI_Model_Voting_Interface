#!/usr/bin/env python3
"""
OpenRouter Markdown Parser for Blind Voting System
Parses exported OpenRouter markdown files and stores them in Supabase
"""

import re
import uuid
import random
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from pathlib import Path
import argparse
import os
from supabase import create_client, Client
from datetime import datetime

@dataclass
class Turn:
    """Represents a conversation turn with user prompt and model responses"""
    user_prompt: str
    responses: List[str]  # 4 responses in order: Gemini, Claude, GPT-4.1, GPT-5

@dataclass
class Conversation:
    """Represents a full conversation from OpenRouter"""
    title: str
    turns: List[Turn]
    source_file: Optional[str] = None

class OpenRouterMarkdownParser:
    """Parser for OpenRouter exported markdown files"""

    # Model names in the expected order from your setup
    MODEL_NAMES = [
        "google/gemini-2.5-pro",
        "anthropic/claude-sonnet-4.5",
        "openai/gpt-4.1",
        "openai/gpt-5"
    ]

    def __init__(self, supabase_url: str, supabase_key: str):
        """Initialize with Supabase credentials"""
        self.supabase: Client = create_client(supabase_url, supabase_key)

    def parse_markdown_file(self, file_path: Path) -> Conversation:
        """Parse a single OpenRouter markdown export file"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract title from first line (remove # prefix)
        lines = content.strip().split('\n')
        title = lines[0].lstrip('#').strip() if lines else file_path.stem

        # Split content into sections by **User - --** and **Assistant - --**
        sections = re.split(r'\*\*(User|Assistant) - --\*\*', content)

        # Remove title section and empty sections, but keep the first empty entry which might contain the title
        sections = [s.strip() for s in sections[1:] if s.strip()]  # Skip the title section

        turns = []
        current_user_prompt = None
        current_responses = []

        i = 0
        while i < len(sections):
            if i % 2 == 0:  # Even indices are section types (User/Assistant)
                section_type = sections[i]
            else:  # Odd indices are section content
                section_content = sections[i]

                if section_type == "User":
                    # Save previous turn if we have one with exactly 4 responses
                    if current_user_prompt and len(current_responses) == 4:
                        turns.append(Turn(current_user_prompt, current_responses))

                    # Start new turn
                    current_user_prompt = section_content.strip()
                    current_responses = []

                elif section_type == "Assistant" and current_user_prompt:
                    # Only collect responses if we have a prompt
                    current_responses.append(section_content.strip())

            i += 1

        # Don't forget the last turn
        if current_user_prompt and len(current_responses) == 4:
            turns.append(Turn(current_user_prompt, current_responses))

        return Conversation(title=title, turns=turns, source_file=str(file_path))

    def randomize_positions(self, turn_id: str, response_ids: List[str]) -> Dict[str, str]:
        """Create randomized A/B/C/D position mapping for a turn"""
        positions = ['A', 'B', 'C', 'D']
        random.shuffle(positions)
        return dict(zip(response_ids, positions))

    def store_conversation(self, conversation: Conversation) -> str:
        """Store conversation in Supabase and return conversation ID"""

        # Insert conversation
        conv_result = self.supabase.table("conversations").insert({
            "title": conversation.title,
            "source_file": conversation.source_file,
            "imported_at": datetime.now().isoformat()
        }).execute()

        conversation_id = conv_result.data[0]["id"]
        print(f"Created conversation: {conversation.title} (ID: {conversation_id})")

        # Process each turn
        for turn_number, turn in enumerate(conversation.turns, 1):
            # Insert turn
            turn_result = self.supabase.table("turns").insert({
                "conversation_id": conversation_id,
                "turn_number": turn_number,
                "user_prompt": turn.user_prompt
            }).execute()

            turn_id = turn_result.data[0]["id"]
            print(f"  Turn {turn_number}: {turn.user_prompt[:50]}...")

            # Insert responses with model mapping
            response_ids = []
            for response_order, (model_name, response_text) in enumerate(zip(self.MODEL_NAMES, turn.responses), 1):
                response_result = self.supabase.table("responses").insert({
                    "turn_id": turn_id,
                    "model_name": model_name,
                    "response_text": response_text,
                    "response_order": response_order
                }).execute()

                response_ids.append(response_result.data[0]["id"])

            # Create randomized position mappings
            position_mapping = self.randomize_positions(turn_id, response_ids)

            for response_id, position in position_mapping.items():
                self.supabase.table("response_positions").insert({
                    "turn_id": turn_id,
                    "response_id": response_id,
                    "position": position
                }).execute()

            print(f"    Randomized positions: {dict(zip(self.MODEL_NAMES, [position_mapping[rid] for rid in response_ids]))}")

        return conversation_id

    def process_file(self, file_path: Path) -> str:
        """Parse and store a single markdown file"""
        print(f"\nProcessing: {file_path}")

        try:
            conversation = self.parse_markdown_file(file_path)
            print(f"Parsed {len(conversation.turns)} turns")

            if not conversation.turns:
                print("Warning: No valid turns found in file")
                return None

            # Validate that all turns have exactly 4 responses
            for i, turn in enumerate(conversation.turns, 1):
                if len(turn.responses) != 4:
                    print(f"Warning: Turn {i} has {len(turn.responses)} responses, expected 4")
                    return None

            conversation_id = self.store_conversation(conversation)
            print(f"Successfully stored conversation with ID: {conversation_id}")
            return conversation_id

        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            return None

    def process_directory(self, directory_path: Path) -> List[str]:
        """Process all .md files in a directory"""
        md_files = list(directory_path.glob("*.md"))
        print(f"Found {len(md_files)} markdown files in {directory_path}")

        conversation_ids = []
        for md_file in md_files:
            conv_id = self.process_file(md_file)
            if conv_id:
                conversation_ids.append(conv_id)

        return conversation_ids


def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description="Parse OpenRouter markdown exports for blind voting")
    parser.add_argument("path", help="Path to markdown file or directory containing .md files")
    parser.add_argument("--supabase-url",
                       default="https://tmkobgbqrbaascebzbny.supabase.co",
                       help="Supabase URL")
    parser.add_argument("--supabase-key",
                       help="Supabase anon key (or set SUPABASE_KEY env var)")

    args = parser.parse_args()

    # Get Supabase key from arg or environment
    supabase_key = args.supabase_key or os.getenv("SUPABASE_KEY")
    if not supabase_key:
        print("Error: Supabase key required. Use --supabase-key or set SUPABASE_KEY env var")
        return 1

    # Initialize parser
    parser_instance = OpenRouterMarkdownParser(args.supabase_url, supabase_key)

    # Process file or directory
    path = Path(args.path)
    if path.is_file():
        parser_instance.process_file(path)
    elif path.is_dir():
        parser_instance.process_directory(path)
    else:
        print(f"Error: {path} is not a valid file or directory")
        return 1

    print("\nProcessing complete!")
    return 0


if __name__ == "__main__":
    exit(main())