    //
//  AiaPlugin.m
//  Copyright (c) 2016 AIA Awesome team!
//

#import "Foundation/Foundation.h"
#import "Cordova/CDV.h"

@interface AiaPlugin : CDVPlugin

- (void) encryptionKey:(CDVInvokedUrlCommand*)command;
- (void) uuid:(CDVInvokedUrlCommand*)command;

@end
