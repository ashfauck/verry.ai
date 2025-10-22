cmake_minimum_required(VERSION 3.13)
project(DocumentProcessor)

# Find React Native directory
set(RN_DIR ${CMAKE_SOURCE_DIR}/../../../../../node_modules/react-native)
set(REACT_ANDROID_DIR ${RN_DIR}/ReactAndroid)

# Include React Native JSI headers
include_directories(
  ${RN_DIR}/ReactCommon/jsi
  ${RN_DIR}/ReactAndroid/src/main/jni/react/turbomodule
  ${RN_DIR}/ReactCommon
  ${RN_DIR}/ReactCommon/callinvoker
  ${RN_DIR}/ReactCommon/runtimeexecutor
)

add_library(document-processor SHARED DocumentProcessor.cpp)

# To enable OpenCV on Android, vendor OpenCV SDK or use a prebuilt distribution then:
#   set(USE_OPENCV 1)
#   add_compile_definitions(USE_OPENCV)
#   set(OpenCV_DIR ${CMAKE_SOURCE_DIR}/opencv/sdk/native/jni) # adjust path
#   find_package(OpenCV REQUIRED)
#   include_directories(${OpenCV_INCLUDE_DIRS})
#   target_link_libraries(document-processor ${OpenCV_LIBS})

# When OpenCV is later integrated, link libraries here (find_package(OpenCV REQUIRED) ... target_link_libraries)

# To enable OpenCV detection, after adding OpenCV to your project:
# set(USE_OPENCV 1)
# add_compile_definitions(USE_OPENCV)
# find_package(OpenCV REQUIRED)
# include_directories(${OpenCV_INCLUDE_DIRS})
# target_link_libraries(document-processor ${OpenCV_LIBS})

find_library(log-lib log)

# Link with Android log library only
# JSI is header-only and symbols will be resolved at runtime by React Native
target_link_libraries(document-processor ${log-lib} android)
