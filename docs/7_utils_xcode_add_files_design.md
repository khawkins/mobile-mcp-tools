# Utils Xcode Add Files - MCP Tool Design

## Overview

The `utils-xcode-add-files` MCP tool generates Ruby commands using the xcodeproj gem to add newly created files to Xcode projects. This tool addresses a common oversight where LLMs generate new Swift/Objective-C files but forget to add them to the Xcode project, resulting in compilation errors and missing functionality.

**Core Philosophy**: Generate reliable xcodeproj gem commands that LLMs can execute to integrate new source files, providing transparency and control over the Xcode project modification process.

---

## Tool Specification

### Input Schema

```typescript
{
  projectPath: string;           // Absolute path to the Xcode project directory
  xcodeProjectPath: string;      // Path to the .xcodeproj file (e.g., "MyApp.xcodeproj")
  newFilePaths: string[];        // Array of newly created file paths relative to project root
  targetName?: string;           // Optional: specific target to add files to (defaults to main app target)
}
```

### Output Structure

The tool returns a JSON response containing:
- Success/failure status
- Generated Ruby command using xcodeproj gem
- Project path and file paths to be added
- Target name (if specified)
- Descriptive message

## Implementation Approach

The tool generates xcodeproj gem commands:

1. **Validate Input**: Confirm project and files exist
2. **Build Ruby Command**: Generate inline Ruby code using xcodeproj gem
3. **Return Command**: Provide ready-to-execute command for LLM
4. **LLM Execution**: LLM can review and execute the generated command
5. **Transparent Control**: Full visibility into project modification process

---

## Example Output

```json
{
  "success": true,
  "command": "ruby -e \"require 'xcodeproj'; require 'json'; require 'pathname'; ...\"",
  "projectPath": "/path/to/ContactApp.xcodeproj",
  "filePaths": [
    "/path/to/ContactManager.swift",
    "/path/to/ContactView.swift"
  ],
  "targetName": "ContactApp",
  "message": "Generated command to add 2 files to Xcode project"
}
```

## Tool Implementation

### Generated Ruby Command Structure

The tool creates an inline Ruby command that:

1. **Validates Project**: Confirms the .xcodeproj file exists
2. **Opens Project**: Uses `Xcodeproj::Project.open()` to load the project
3. **Finds Target**: Locates the specified target or uses the first available target
4. **Processes Files**: For each file:
   - Calculates relative path from project directory
   - Creates file reference using `project.main_group.new_file()`
   - Adds to build phase if it's a source file (.swift, .m, .mm, .c, .cpp, .cc, .cxx)
5. **Saves Project**: Calls `project.save` to persist changes
6. **Returns Results**: Outputs JSON with success status and file details

### Example Generated Command

```ruby
ruby -e "
require 'xcodeproj'
require 'json'
require 'pathname'

begin
  project_path = '/path/to/MyApp.xcodeproj'
  target_name = nil
  files_to_add = ['/path/to/ContactManager.swift', '/path/to/ContactView.swift']

  unless File.exist?(project_path)
    puts JSON.generate({
      success: false,
      error: 'Project file not found',
      message: \"Could not find Xcode project at #{project_path}\"
    })
    exit 1
  end

  project = Xcodeproj::Project.open(project_path)
  target = target_name ? project.targets.find { |t| t.name == target_name } : project.targets.first

  unless target
    puts JSON.generate({
      success: false,
      error: 'Target not found',
      message: 'No targets found in project'
    })
    exit 1
  end

  files_added = []
  files_failed = []

  files_to_add.each do |file_path|
    unless File.exist?(file_path)
      files_failed << file_path
      next
    end

    begin
      project_dir = File.dirname(project_path)
      relative_path = Pathname.new(file_path).relative_path_from(Pathname.new(project_dir)).to_s
      file_ref = project.main_group.new_file(relative_path)
      
      file_ext = File.extname(file_path).downcase
      source_extensions = ['.swift', '.m', '.mm', '.c', '.cpp', '.cc', '.cxx']
      
      if source_extensions.include?(file_ext)
        target.source_build_phase.add_file_reference(file_ref)
      end
      
      files_added << File.basename(file_path)
    rescue => e
      files_failed << \"#{file_path}: #{e.message}\"
    end
  end

  project.save

  result = {
    success: true,
    filesAdded: files_added,
    target: target.name,
    buildStatus: 'completed',
    message: \"Successfully added #{files_added.length} files to Xcode project\"
  }
  
  if files_failed.any?
    result[:warnings] = \"Failed to add #{files_failed.length} files: #{files_failed.join(', ')}\"
  end

  puts JSON.generate(result)

rescue => e
  puts JSON.generate({
    success: false,
    error: e.class.name,
    message: e.message
  })
  exit 1
end
"
```

## Error Handling

The generated Ruby command handles common failure scenarios:

- **Project file not found**: Returns error if .xcodeproj doesn't exist
- **Invalid file paths**: Skips non-existent files and reports them in warnings
- **Target not found**: Returns error if specified target doesn't exist
- **File addition failures**: Catches exceptions and reports failed files
- **Automatic project saving**: Uses xcodeproj gem's built-in save functionality

## Advantages of xcodeproj Gem Approach

- **Reliability**: Uses the same gem that CocoaPods uses for project manipulation
- **Safety**: Built-in validation and error handling
- **Maintainability**: No manual pbxproj file parsing or UUID generation
- **Transparency**: LLM can review the generated command before execution
- **Flexibility**: Easy to modify or extend the generated Ruby code

## Important Notes

- **Command generation**: Tool generates Ruby commands instead of executing them directly
- **LLM control**: LLM can review and execute commands at their discretion
- **xcodeproj gem dependency**: Leverages CocoaPods prerequisite for iOS Mobile SDK apps
- **Automatic project saving**: Generated command saves project after modifications
- **File type detection**: Automatic detection of source files for build phase inclusion
- **Error reporting**: Comprehensive error handling with JSON output
