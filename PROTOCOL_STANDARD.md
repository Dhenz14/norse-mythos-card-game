# Norse Card Game Protocol Standard

This document defines the standardized format for all protocols in the Norse Card Game development environment.

## 1. Protocol Structure Template

Every protocol must follow this standardized structure:

```markdown
# Protocol Name

## Quick Reference

| Trigger | `refer to [keyword]` |
|---------|----------------------|
| Purpose | Brief description of the protocol's purpose |
| Tools   | List of primary Replit tools used in this protocol |

## 1. Protocol Overview

1.1. **Purpose**: Detailed explanation of when to use this protocol
1.2. **Expected Outcome**: What will be accomplished
1.3. **Required Context**: What information is needed before starting

## 2. Step Section One

2.1. **First Action**
    ```javascript
    // Tool command example
    search_filesystem({
      query_description: "Specific search query"
    });
    ```
    - Note: Additional guidance about this step

2.2. **Second Action**
    ```javascript
    // Another tool example
    str_replace_editor({
      command: "view",
      path: "./path/to/file.ts"
    });
    ```
    - ⚠️ Warning: Important caution about this step

## 3. Step Section Two

3.1. **First Action in Section Two**
    - Details about this step
    - Additional guidance

3.2. **Verification Step**
    ```javascript
    // Verification example
    bash({
      command: "npm test -- --testPathPattern=path/to/test"
    });
    ```
    - ✓ Success criteria: What indicates successful completion

## 4. Conclusion

4.1. **Verification**: Final verification steps
4.2. **Documentation**: Update relevant documentation
4.3. **Next Steps**: Potential follow-up actions
```

## 2. Formatting Standards

### 2.1. Headings

- **H1**: Protocol name
- **H2**: Major sections (numbered as 1., 2., etc.)
- **H3**: Subsections (used sparingly)
- **Bold**: Step names within numbered steps

### 2.2. Step Numbering

- Major sections use single numbers: `## 1. Section Name`
- Steps within sections use decimal notation: `1.1. **Step Name**`
- Sub-steps use bullet points with consistent indentation

### 2.3. Code Blocks

- All tool commands must be in code blocks with JavaScript syntax highlighting
- Show complete tool commands, not partial examples
- Include comments explaining key parameters or actions
- Format consistently with 2-space indentation

### 2.4. Notes and Warnings

- **Notes**: Prefixed with "Note: " in regular text
- **Warnings**: Prefixed with "⚠️ Warning: " in bold text
- **Success Criteria**: Prefixed with "✓ Success criteria: " in regular text

## 3. Tool Integration Standards

### 3.1. File Operations

Every file operation must follow this pattern:

```javascript
// Searching for files
search_filesystem({
  query_description: "Clear description of what you're looking for",
  // Additional parameters as needed
});

// Viewing file content
str_replace_editor({
  command: "view",
  path: "./path/to/file.ext"
});

// Modifying files
str_replace_editor({
  command: "str_replace",
  path: "./path/to/file.ext",
  old_str: "exact string to replace",
  new_str: "replacement string"
});
```

### 3.2. Terminal Commands

Terminal commands must be formatted as:

```javascript
bash({
  command: "clear, specific command"
});
```

### 3.3. Workflow Management

Workflow commands must follow this format:

```javascript
// Restarting workflows
restart_workflow({
  name: "Workflow Name"
});

// Getting user feedback
web_application_feedback_tool({
  workflow_name: "Workflow Name",
  query: "Specific, focused question about the current state"
});
```

### 3.4. Database Operations

Database operations must use:

```javascript
execute_sql_tool({
  sql_query: "SELECT * FROM table WHERE condition = value;"
});
```

## 4. Verification Standards

Every protocol must include verification steps:

### 4.1. Mid-Protocol Verification

After significant changes, include:

```javascript
// Verify changes via testing
bash({
  command: "npm test -- --testPathPattern=relevant/test/path"
});

// Verify via visual inspection
web_application_feedback_tool({
  workflow_name: "Start Game",
  query: "Is [specific element] displaying correctly?"
});
```

### 4.2. Final Verification

End each protocol with:

```javascript
// Final verification sequence
restart_workflow({
  name: "Start Game"
});

web_application_feedback_tool({
  workflow_name: "Start Game",
  query: "Has the [problem/feature] been successfully [fixed/implemented]?"
});
```

## 5. Protocol-Specific Extensions

Different protocol types may include additional standard sections:

### 5.1. Bug Fix Protocols

- Must include "Root Cause Analysis" section
- Must include "Regression Testing" steps
- Must document the fix in BUG_MEMORY.md

### 5.2. Feature Implementation Protocols

- Must include "Requirements Analysis" section
- Must include "Performance Impact" assessment
- Must include "User Experience Considerations"

### 5.3. Card System Protocols

- Must include "Card Property Validation" steps
- Must include "Effect Interaction Testing"
- Must include "Visual Verification"