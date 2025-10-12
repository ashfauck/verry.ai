// Public C interface to install the DocumentProcessor JSI bindings.
// We intentionally avoid exposing C++ types (jsi::Runtime) in the header to prevent
// Objective-C compilation errors where <jsi/jsi.h> is not imported.
#import <Foundation/Foundation.h>

#ifdef __cplusplus
extern "C" {
#endif
void InstallDocumentProcessorRuntime(void *rtPtr);
#ifdef __cplusplus
}
#endif
