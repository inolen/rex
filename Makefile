.PHONY: lib jslint test

all: lib jslint test

lib:
	node-waf configure && node-waf build

jslint:
	find bin lib -name "*.js" -print0 | xargs -0 jshint

test:
	mocha --ui tdd