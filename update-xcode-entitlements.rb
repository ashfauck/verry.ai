#!/usr/bin/env ruby

require 'xcodeproj'

# Path to your Xcode project
project_path = 'ios/VerryApp.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Find the main app target
target = project.targets.find { |t| t.name == 'VerryApp' }

if target.nil?
  puts "❌ Could not find VerryApp target"
  exit 1
end

puts "🔧 Updating entitlements for each build configuration..."

# Map of build configuration to entitlements file
entitlements_map = {
  'Debug' => 'VerryApp/VerryApp-Production.entitlements',
  'Release' => 'VerryApp/VerryApp-Production.entitlements', 
  'Dev.Debug' => 'VerryApp/VerryApp-Development.entitlements',
  'Dev.Release' => 'VerryApp/VerryApp-Development.entitlements',
  'QA.Debug' => 'VerryApp/VerryApp-Staging.entitlements',
  'QA.Release' => 'VerryApp/VerryApp-Staging.entitlements'
}

# Update each build configuration
target.build_configurations.each do |config|
  config_name = config.name
  entitlements_file = entitlements_map[config_name]
  
  if entitlements_file
    puts "✅ Setting #{config_name} → #{entitlements_file}"
    config.build_settings['CODE_SIGN_ENTITLEMENTS'] = entitlements_file
  else
    puts "⚠️  Unknown configuration: #{config_name}"
  end
end

# Save the project
project.save

puts ""
puts "🎉 Successfully updated Xcode project with environment-specific entitlements!"
puts ""
puts "📋 Configuration Summary:"
entitlements_map.each do |config, entitlements|
  puts "   #{config.ljust(12)} → #{entitlements}"
end

puts ""
puts "🔄 Next Steps:"
puts "1. Open Xcode and verify the entitlements are set correctly"
puts "2. Build with different schemes to test each configuration"
puts "3. Each configuration will now use its own associated domains"