cmake_minimum_required(VERSION 3.13)
project(DocumentProcessor)

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

target_link_libraries(document-processor ${log-lib})
