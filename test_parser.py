#!/usr/bin/env python3
"""
Test the OpenRouter markdown parser without Supabase
"""

import re
from typing import List
from dataclasses import dataclass
from pathlib import Path

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
    source_file: str = None

def parse_markdown_file(file_path: Path) -> Conversation:
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

    print(f"Found {len(sections)} sections after splitting")

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
                    print(f"Added turn with {len(current_responses)} responses")

                # Start new turn
                current_user_prompt = section_content.strip()
                current_responses = []
                print(f"New user prompt: {current_user_prompt[:50]}...")

            elif section_type == "Assistant" and current_user_prompt:
                # Only collect responses if we have a prompt
                current_responses.append(section_content.strip())
                print(f"Added assistant response #{len(current_responses)}: {len(section_content)} chars")

        i += 1

    # Don't forget the last turn
    if current_user_prompt and len(current_responses) == 4:
        turns.append(Turn(current_user_prompt, current_responses))
        print(f"Added final turn with {len(current_responses)} responses")

    return Conversation(title=title, turns=turns, source_file=str(file_path))

def main():
    # Test with the sample file
    test_file = Path('/Users/brussiarias/Downloads/OpenRouter Chat Wed Dec 03 2025 (1).md')

    if not test_file.exists():
        print(f"Test file not found: {test_file}")
        return

    print("Testing markdown parser...")
    conversation = parse_markdown_file(test_file)

    print(f"Title: {conversation.title}")
    print(f"Number of turns: {len(conversation.turns)}")

    model_names = [
        "google/gemini-2.5-pro",
        "anthropic/claude-sonnet-4.5",
        "openai/gpt-4.1",
        "openai/gpt-5"
    ]

    for i, turn in enumerate(conversation.turns, 1):
        print(f"\n--- Turn {i} ---")
        print(f"Prompt: {turn.user_prompt[:100]}...")
        print(f"Number of responses: {len(turn.responses)}")

        if len(turn.responses) != 4:
            print(f"WARNING: Expected 4 responses, got {len(turn.responses)}")

        for j, (model, response) in enumerate(zip(model_names, turn.responses), 1):
            print(f"  {model}: {len(response)} characters")
            print(f"    Preview: {response[:80]}...")

    print(f"\n✅ Parser test completed!")
    print(f"   Parsed {len(conversation.turns)} turns successfully")

    if conversation.turns and len(conversation.turns[0].responses) == 4:
        print("   ✅ Response format is correct")
    else:
        print("   ❌ Response format needs adjustment")

if __name__ == "__main__":
    main()