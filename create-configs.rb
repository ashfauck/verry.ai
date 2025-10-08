#!/usr/bin/env ruby

# iOS 6-Configuration Auto Creator
# This script automatically adds the 4 new build configurations to the Xcode project

require 'xcodeproj'

PROJECT_PATH = '/Users/ashfauck/Development/Projects/Personal/Verry.ai/ios/VerryApp.xcodeproj'

puts "🔧 Creating 6-Configuration Setup for iOS"
puts "=========================================="

begin
  # Open the Xcode project
  project = Xcodeproj::Project.open(PROJECT_PATH)
  puts "✅ Opened project: #{PROJECT_PATH}"

  # Get existing configurations
  existing_configs = project.build_configuration_list.build_configurations.map(&:name)
  puts "📋 Existing configurations: #{existing_configs.join(', ')}"

  # Configurations to add
  new_configs = [
    { name: 'Dev.Debug', base: 'Debug', xcconfig: 'Dev.Debug.xcconfig' },
    { name: 'Dev.Release', base: 'Release', xcconfig: 'Dev.Release.xcconfig' },
    { name: 'QA.Debug', base: 'Debug', xcconfig: 'QA.Debug.xcconfig' },
    { name: 'QA.Release', base: 'Release', xcconfig: 'QA.Release.xcconfig' }
  ]

  # Add new build configurations to project
  new_configs.each do |config_info|
    config_name = config_info[:name]
    
    # Skip if already exists
    if existing_configs.include?(config_name)
      puts "⚠️  Configuration '#{config_name}' already exists, skipping"
      next
    end

    puts "➕ Adding configuration: #{config_name}"
    
    # Find the base configuration to duplicate
    base_config = project.build_configuration_list.build_configurations.find { |c| c.name == config_info[:base] }
    
    if base_config.nil?
      puts "❌ Base configuration '#{config_info[:base]}' not found"
      next
    end

    # Create new configuration by duplicating the base
    new_config = project.new(Xcodeproj::Project::Object::XCBuildConfiguration)
    new_config.name = config_name
    new_config.build_settings = base_config.build_settings.dup
    
    # Set the xcconfig file reference
    xcconfig_file = project.files.find { |file| file.path == config_info[:xcconfig] }
    if xcconfig_file
      new_config.base_configuration_reference = xcconfig_file
      puts "  ✅ Linked to #{config_info[:xcconfig]}"
    else
      puts "  ⚠️  xcconfig file #{config_info[:xcconfig]} not found in project"
    end
    
    # Add to project build configuration list
    project.build_configuration_list.build_configurations << new_config
    
    # Add to all targets
    project.targets.each do |target|
      target_config = target.build_configuration_list.build_configurations.find { |c| c.name == config_info[:base] }
      if target_config
        new_target_config = project.new(Xcodeproj::Project::Object::XCBuildConfiguration)
        new_target_config.name = config_name
        new_target_config.build_settings = target_config.build_settings.dup
        
        # Link xcconfig for target too if it's the main target
        if target.name == 'HelloWorld' && xcconfig_file
          new_target_config.base_configuration_reference = xcconfig_file
        end
        
        target.build_configuration_list.build_configurations << new_target_config
      end
    end
  end

  # Save the project
  project.save
  puts "💾 Project saved successfully"

  puts ""
  puts "✅ 6-Configuration setup complete!"
  puts ""
  puts "📋 All configurations now available:"
  project.build_configuration_list.build_configurations.each do |config|
    puts "   - #{config.name}"
  end

  puts ""
  puts "🎯 Next: Update schemes to use new configurations:"
  puts "   - VerryAppDevelopment → Dev.Debug/Dev.Release"
  puts "   - VerryAppStaging → QA.Debug/QA.Release"  
  puts "   - VerryAppProduction → Debug/Release"

rescue => e
  puts "❌ Error: #{e.message}"
  puts "💡 Make sure you have the xcodeproj gem installed:"
  puts "   gem install xcodeproj"
  exit 1
end