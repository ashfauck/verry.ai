require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

puts "Testing use_native_modules! function..."
begin
  config = use_native_modules!
  puts "Success: #{config}"
rescue => e
  puts "Error: #{e.message}"
  puts "Backtrace: #{e.backtrace.join("\n")}"
end