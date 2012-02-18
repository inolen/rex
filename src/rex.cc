#include <v8.h>
#include <node.h>
#include <errno.h>
#include <string.h>
#include <unistd.h>

using namespace v8;

static Handle<Value> chroot_wrapper(const Arguments& args) {
	if (args.Length() != 1) {
	    const char* message = "chroot() takes one argument";
		return ThrowException(Exception::Error(String::New(message)));
	}

	String::Utf8Value root(args[0]);

    if (*root == NULL) {
      const char* message = "chroot(): String conversion of argument failed.";
      return ThrowException(String::New(message));
    }

    if (chroot(*root) != 0) {
      return ThrowException(String::New(strerror(errno)));
    }

    return v8::Undefined();
}

extern "C" void init (Handle<Object> target) {
	NODE_SET_METHOD(target, "chroot", chroot_wrapper);
}
