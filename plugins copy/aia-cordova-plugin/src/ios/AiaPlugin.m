//
//  AiaPlugin.m
//  Copyright (c) 2016 AIA Awesome team!
//

#import "Cordova/CDV.h"
#import "Cordova/CDVViewController.h"
#import "NSData+Hex.h"
#import "NSData+CommonCrypto.h"
#import "AiaPlugin.h"
#import "AppDelegate.h"
#import "EncryptDemo.h"
#import "AESCrypt.h"

#import <AdSupport/AdSupport.h>

@implementation AiaPlugin

-(void) encryptionKey:(CDVInvokedUrlCommand*)command
{
    
    
    [self.commandDelegate runInBackground:^{
        EncryptDemo * encrypDemo=[[EncryptDemo alloc]init];
        
        NSDictionary * dict1=[encrypDemo enryptDataCheckandKey:[command.arguments objectAtIndex:0]];
        
        //@"publicKey"@"sharedKey"
        
        
        CDVPluginResult *pluginResult = [ CDVPluginResult
                                         resultWithStatus   : CDVCommandStatus_OK
                                         messageAsDictionary    : dict1
                                         ];
        
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    }];
}

-(void) uuid:(CDVInvokedUrlCommand*)command
{
    [self.commandDelegate runInBackground:^{
        
        NSDictionary * dict = [NSDictionary dictionaryWithObjectsAndKeys:[[ASIdentifierManager sharedManager].advertisingIdentifier UUIDString],@"uuid", nil];
        
        CDVPluginResult *pluginResult = [ CDVPluginResult
                                         resultWithStatus   : CDVCommandStatus_OK
                                         messageAsDictionary    : dict
                                         ];
        
        [self.commandDelegate sendPluginResult:pluginResult callbackId:command.callbackId];
        
    }];
}
@end
