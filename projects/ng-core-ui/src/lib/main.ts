
import {EnvironmentProviders, makeEnvironmentProviders,InjectionToken} from '@angular/core';


export const LIB_APP_ID = new InjectionToken<string>('LIB_APP_ID');
export const LIB_APP_SHA = new InjectionToken<string>('LIB_APP_SHA');
export const LIB_APP_VERSION = new InjectionToken<string>('LIB_APP_VERSION');

export function provideGPAUICore(AppId: string,AppSha:string, AppVersion:  string) : EnvironmentProviders {

return makeEnvironmentProviders( [ {provide: LIB_APP_ID, useValue: AppId}   , {provide: LIB_APP_VERSION, useValue: AppVersion}, {provide: LIB_APP_SHA, useValue: AppSha}  ]);

}
