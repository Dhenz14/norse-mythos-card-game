# Replit Agent Guide for Norse Card Game

## Quick Reference

| Command Type | Trigger/Syntax | Description |
|-------------|---------------|-------------|
| **Development Rules** | refer to rules | Access the development standards and rules |
| **Strategic Analysis** | Use Think Tools [question] | Analyze strategic game questions |
| **Bug Diagnosis** | refer to failedfix | Systematic re-diagnosis for failed fixes |
| **Card Bug Pattern** | refer to cardbugs | Specialized protocol for card system bugs |
| **Rendering Debug** | refer to renderbug | Debug 3D card rendering issues |
| **New Features** | refer to new features | Protocol for implementing new features |
| **Tool Integration** | refer to tools | Access Replit tool integration patterns |
| **File Editing** | n/a | Use `str_replace_editor` tool for file operations |
| **Shell Commands** | n/a | Use `bash` tool for terminal commands |
| **Database Operations** | n/a | Use `execute_sql_tool` for database queries |

## Replit Agent Capabilities

### File Operations

The Replit agent provides powerful file manipulation capabilities through the `str_replace_editor` tool:

```
# View a file
str_replace_editor command=view path=/path/to/file.js

# Create a new file
str_replace_editor command=create path=/path/to/newfile.js file_text="content here"

# Replace content in a file
str_replace_editor command=str_replace path=/path/to/file.js old_str="text to replace" new_str="new text"

# Insert content at a specific line
str_replace_editor command=insert path=/path/to/file.js insert_line=10 new_str="content to insert"

# Undo an edit
str_replace_editor command=undo_edit path=/path/to/file.js
```

### Terminal Commands

Execute terminal commands using the `bash` tool:

```
# Run a simple command
bash command="ls -la"

# Navigate directories
bash command="cd /path/to/directory && ls"

# Install dependencies
bash command="npm install package-name"

# Check server status
bash command="ps aux | grep node"
```

### Database Operations

Interact with the PostgreSQL database using the `execute_sql_tool`:

```
# Query data
execute_sql_tool sql_query="SELECT * FROM cards WHERE class = 'Thor' LIMIT 10;"

# Create a table
execute_sql_tool sql_query="CREATE TABLE IF NOT EXISTS deck_stats (id SERIAL PRIMARY KEY, deck_name TEXT, win_rate FLOAT);"

# Insert data
execute_sql_tool sql_query="INSERT INTO deck_stats (deck_name, win_rate) VALUES ('Control Odin', 0.65);"
```

### Workflow Management

Manage Replit workflows using these commands:

```
# Restart a workflow
restart_workflow name="Start Game"

# Get application feedback
web_application_feedback_tool workflow_name="Start Game" query="How does the new feature look?"
```

## Strategic Analysis with Think Tools

The Norse Card Game provides advanced strategic analysis through the Think Tools system. This system helps optimize deck building and gameplay strategy.

### Accessing Think Tools

To access Think Tools, start your query with:

```
Use Think Tools [your strategic question]
```

Examples:
- "Use Think Tools how to counter aggressive Thor decks"
- "Use Think Tools I want a deck with lots of small minions"
- "Use Think Tools what's the best lategame strategy"

### Think Tools Components

The system consists of two parts:

1. **Sequential Thinking** - Breaks down problems into logical steps
2. **Think Tool Analysis** - Generates strategic recommendations

When activated, you'll see clear visual indicators as specified in the THINK_TOOLS_FORMAT_GUIDE.md. The exact format must be followed:

```
🔮 THINK TOOLS ACTIVATED 🔮

⚡ SEQUENTIAL THINKING ACTIVATED ⚡
Step 1: [Step Title]
• [Detail point]
• [Detail point]

Step 2: [Step Title]
• [Detail point]
• [Detail point]

⚡ SEQUENTIAL THINKING COMPLETE ⚡

🌲 THINK TOOL ACTIVATED 🌲
[Analysis Category]
• [Analysis point]
• [Analysis point]

🌲 THINK TOOL COMPLETE 🌲

Implementation Plan
[Actual steps taken or recommendations]
```

> **Important**: Always follow the exact format in THINK_TOOLS_FORMAT_GUIDE.md for all Think Tools responses, including emoji placement, bullet formatting, and implementation plan structure.

## Troubleshooting Protocols

### Systematic Re-Diagnosis (failedfix)

When previous fix attempts have failed, trigger this protocol with:

```
refer to failedfix
```

This 13-step protocol helps systematically identify root causes and develop targeted solutions.

### Card Bug Pattern Recognition (cardbugs)

For issues with the card system, use:

```
refer to cardbugs
```

This protocol helps identify and fix common issues like missing properties, duplicate properties, syntax errors, and effect problems.

### Rendering Debug Protocol (renderbug)

For 3D card rendering issues, use:

```
refer to renderbug
```

This protocol addresses visual artifacts, performance problems, and animation glitches.

## Implementing New Features (new features)

For adding new features to the game, use:

```
refer to new features
```

This protocol provides a comprehensive approach to feature implementation, from analysis and research through implementation and validation.

## Development Best Practices

### Performance Standards

The game must maintain these performance thresholds:
- Rendering: 60 FPS, 16ms frame time
- Interactions: < 50ms response time
- Memory: < 512MB usage
- Loading: < 2s asset time

### Code Quality

All code must follow these standards:
- Use TypeScript for type safety
- Follow ESLint configuration rules
- Maintain proper error handling
- Document all public APIs
- Write tests for new functionality

### Testing Requirements

All features must be tested for:
- Functionality in normal conditions
- Error handling and edge cases
- Performance impact
- Memory leaks
- Cross-browser compatibility

## Common Tasks

### Adding a New Card

1. Identify the card's class, cost, and effects
2. Use the card template structure
3. Add to the appropriate card file
4. Test in isolation
5. Test in gameplay scenarios

### Implementing a New Card Effect

1. Identify similar existing effects
2. Create the effect definition
3. Add trigger conditions
4. Implement visual feedback
5. Test interactions with other cards

### Debugging Card Interactions

1. Check card definitions for property issues
2. Verify effect trigger conditions
3. Check for animation synchronization
4. Test with multiple interaction sequences
5. Validate state management

## Getting Help

If you encounter issues not covered by these protocols:

1. Check BUG_MEMORY.md for similar previous issues
2. Use the search_filesystem tool to locate relevant code
3. Examine related card effects or mechanics
4. Create isolated test cases to verify behavior
5. Document your findings for future reference