from retrive import generate_story_options

# Example previous plot
previous_plot = """
The protagonist, Alex, finds themselves in a mysterious forest where the trees seem to whisper secrets of an ancient curse. 
A glowing artifact lies at the center of a clearing, pulsating with energy.
"""

# Call the function
story_options = generate_story_options(previous_plot)

# Print the generated options
print("Generated Story Options:")
for i, option in enumerate(story_options, start=1):
    print(f"Option {i}: {option}")