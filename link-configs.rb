#!/usr/bin/env ruby

# Add xcconfig files to Xcode project and link them

require 'xcodeproj'

PROJECT_PATH = '/Users/ashfauck/Development/Projects/Personal/Verry.ai/ios/VerryApp.xcodeproj'

puts "🔗 Adding xcconfig files to Xcode project"
puts "========================================="

begin
  project = Xcodeproj::Project.open(PROJECT_PATH)
  
  # xcconfig files to add
  xcconfig_files = [
    { name: 'Debug.xcconfig', config: 'Debug' },
    { name: 'Release.xcconfig', config: 'Release' },
    { name: 'Dev.Debug.xcconfig', config: 'Dev.Debug' },
    { name: 'Dev.Release.xcconfig', config: 'Dev.Release' },
    { name: 'QA.Debug.xcconfig', config: 'QA.Debug' },
    { name: 'QA.Release.xcconfig', config: 'QA.Release' }
  ]
  
  xcconfig_files.each do |file_info|
    filename = file_info[:name]
    config_name = file_info[:config]
    
    # Check if file already exists in project
    existing_file = project.files.find { |f| f.path == filename }
    
    if existing_file
      puts "✅ #{filename} already in project"
      file_ref = existing_file
    else
      # Add file to project
      file_ref = project.new_file(filename)
      puts "➕ Added #{filename} to project"
    end
    
    # Link to build configuration
    project_config = project.build_configuration_list.build_configurations.find { |c| c.name == config_name }
    if project_config
      project_config.base_configuration_reference = file_ref
      puts "🔗 Linked #{filename} to #{config_name} (project)"
    end
    
    # Link to target configurations
    project.targets.each do |target|
      if target.name == 'HelloWorld'  # Main app target
        target_config = target.build_configuration_list.build_configurations.find { |c| c.name == config_name }
        if target_config
          target_config.base_configuration_reference = file_ref
          puts "🔗 Linked #{filename} to #{config_name} (#{target.name})"
        end
      end
    end
  end
  
  project.save
  puts "💾 Project updated and saved"
  
  puts ""
  puts "✅ All xcconfig files linked to configurations!"
  puts ""
  puts "🎯 Configuration mapping:"
  xcconfig_files.each do |file_info|
    puts "   #{file_info[:config]} → #{file_info[:name]}"
  end

rescue => e
  puts "❌ Error: #{e.message}"
  puts e.backtrace
end