#!/usr/bin/env ruby

# Update iOS schemes to use the correct build configurations

require 'xcodeproj'

PROJECT_PATH = '/Users/ashfauck/Development/Projects/Personal/Verry.ai/ios/VerryApp.xcodeproj'

puts "🎯 Updating schemes to use new build configurations"
puts "=================================================="

begin
  project = Xcodeproj::Project.open(PROJECT_PATH)
  
  # Scheme updates
  scheme_updates = [
    {
      name: 'VerryAppDevelopment',
      debug_config: 'Dev.Debug',
      release_config: 'Dev.Release'
    },
    {
      name: 'VerryAppStaging', 
      debug_config: 'QA.Debug',
      release_config: 'QA.Release'
    },
    {
      name: 'VerryAppProduction',
      debug_config: 'Debug',
      release_config: 'Release'
    }
  ]
  
  scheme_updates.each do |scheme_info|
    scheme_name = scheme_info[:name]
    scheme_path = File.join(PROJECT_PATH, 'xcshareddata', 'xcschemes', "#{scheme_name}.xcscheme")
    
    if File.exist?(scheme_path)
      puts "📝 Updating scheme: #{scheme_name}"
      
      # Read and update scheme XML
      scheme_content = File.read(scheme_path)
      
      # Update build configurations in the scheme
      # Test and Launch actions typically use debug config
      scheme_content.gsub!(/buildConfiguration = "(Debug|Release|Dev\.Debug|Dev\.Release|QA\.Debug|QA\.Release)"/) do |match|
        action_type = scheme_content[scheme_content.rindex('<', scheme_content.index(match))..scheme_content.index('>', scheme_content.index(match))]
        
        case action_type
        when /<TestAction/, /<LaunchAction/, /<AnalyzeAction/
          %Q(buildConfiguration = "#{scheme_info[:debug_config]}")
        when /<ProfileAction/, /<ArchiveAction/  
          %Q(buildConfiguration = "#{scheme_info[:release_config]}")
        else
          match # Keep original if we can't determine
        end
      end
      
      File.write(scheme_path, scheme_content)
      puts "  ✅ Updated configurations:"
      puts "     Debug actions: #{scheme_info[:debug_config]}"
      puts "     Release actions: #{scheme_info[:release_config]}"
    else
      puts "⚠️  Scheme file not found: #{scheme_path}"
    end
  end
  
  puts ""
  puts "✅ All schemes updated successfully!"
  puts ""
  puts "🧪 Ready to test configurations:"
  puts "   Run: ./test-all-configs.sh"

rescue => e
  puts "❌ Error: #{e.message}"
  puts e.backtrace
end