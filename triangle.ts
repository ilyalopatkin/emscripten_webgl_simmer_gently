///<reference path="input.ts"/>

module TriangleExample {
    //type declarations for emscripten module and wrappers
    declare var Module: {
        cwrap: (name: string, returnType: string, params: string[]) => any;
        setValue: (ptr: number, value: number, type: string) => void;
    }
    declare var _malloc: (number) => number;
    declare var _free: (number) => void;

    //bindings to C++ functions
    class Bindings {
        public static initGL: (width: number, height: number) => number
            = Module.cwrap('initGL', 'number', ['number', 'number']);
        public static drawTriangle: (translationPtr: number) => void
            = Module.cwrap('drawTriangle', '', ['number']);
    }

    //a helper for some JS-to-Emscripten conversions
    class HeapUtils {
        public static floatArrayToHeap(arr: number[]): number {
            var arrayPointer = _malloc(arr.length * 4);
            for (var i = 0; i < arr.length; i++)
                Module.setValue(arrayPointer + i * 4, arr[i], 'float');
            return arrayPointer;
        }
    }

    //our program that draws a triangle
    export class Program implements IPanZoomable {
        //current translation of the triangle
        private translation = { originX: 0, originY: 0, zoom: 1.0 };
        //mouse event handler
        private mouseController;

        constructor(private canvas: HTMLCanvasElement) {
            //initialise the GL context, call the compiled native function
            var initialised = Bindings.initGL(canvas.width, canvas.height);
            if (!initialised) {
                console.log("Could not initialise GL");
                return;
            }
            //get the mouse listen to canvas mouse events
            this.mouseController = new MouseController(canvas, this);
            //request redraw
            this.invalidate();
        }

        //translate the whole GL scene by offset
        pan(offset: Point) {
            var glOffset = {
                x: offset.x / this.canvas.width * 2.0 / this.translation.zoom,
                y: offset.y / this.canvas.height * 2.0 / this.translation.zoom
            };
            this.translation.originX += glOffset.x;
            this.translation.originY -= glOffset.y;
            this.invalidate();
        }

        //zoom by the given ratio
        zoom(ratio: number, origin: Point) {
            this.translation.zoom *= ratio;
            this.invalidate();
        }

        //render the scene
        private render() {
            //convert the JS translation object to an emscripten array of floats
            var translationPtr = HeapUtils.floatArrayToHeap(
                [this.translation.originX, this.translation.originY, this.translation.zoom]
            );
            //call the native draw function
            Bindings.drawTriangle(translationPtr);
            //free the array memory
            _free(translationPtr);
        }

        public invalidate() {
            window.requestAnimationFrame(this.render.bind(this));
        }
    }
}