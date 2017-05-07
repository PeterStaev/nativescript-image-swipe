import { NgModule } from "@angular/core";
import { NativeScriptRouterModule } from "nativescript-angular/router";
import { Routes } from "@angular/router";

import { ImageSwipeComponent } from "./imageswipe/imageswipe.component";

const routes: Routes = [
    { path: "", redirectTo: "/demo", pathMatch: "full" },
    { path: "demo", component: ImageSwipeComponent },
];

@NgModule({
    imports: [NativeScriptRouterModule.forRoot(routes)],
    exports: [NativeScriptRouterModule]
})
export class AppRoutingModule { }