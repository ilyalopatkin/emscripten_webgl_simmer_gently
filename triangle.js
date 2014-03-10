var TriangleExample;
(function (TriangleExample) {
    var MouseController = (function () {
        function MouseController(canvas, area) {
            this.canvas = canvas;
            this.area = area;
            this.isMouseDown = false;
            this.lastMouseCoord = null;
            this.zoomSensitivity = 2.0;
            $(canvas).mousewheel(this.onMouseWheel.bind(this));
            canvas.onmousedown = this.onMouseDown.bind(this);
            canvas.onmouseup = this.onMouseUp.bind(this);
            canvas.onmousemove = this.onMouseMove.bind(this);
            canvas.onmouseleave = this.onMouseLeave.bind(this);
        }
        MouseController.prototype.getLocalCoord = function (ev) {
            return { x: ev.clientX - this.canvas.offsetLeft, y: ev.clientY - this.canvas.offsetTop };
        };

        MouseController.prototype.onMouseDown = function (ev) {
            var e = this.getLocalCoord(ev);
            this.isMouseDown = true;
            this.lastMouseCoord = e;
        };

        MouseController.prototype.onMouseUp = function (ev) {
            var e = this.getLocalCoord(ev);
            this.isMouseDown = false;
            this.lastMouseCoord = null;
        };

        MouseController.prototype.onMouseMove = function (ev) {
            var e = this.getLocalCoord(ev);
            if (this.isMouseDown) {
                var offset = { x: e.x - this.lastMouseCoord.x, y: e.y - this.lastMouseCoord.y };
                this.lastMouseCoord = e;
                this.area.pan(offset);
            }
        };

        MouseController.prototype.onMouseLeave = function (ev) {
            this.isMouseDown = false;
        };

        MouseController.prototype.onMouseWheel = function (ev) {
            ev.wheelDelta = ev.deltaY * 120.0;
            var e = this.getLocalCoord(ev);
            this.area.zoom(1.0 + ev.wheelDelta / 1200.0 * this.zoomSensitivity, e);
            return false;
        };
        return MouseController;
    })();
    TriangleExample.MouseController = MouseController;
})(TriangleExample || (TriangleExample = {}));
///<reference path="input.ts"/>
var TriangleExample;
(function (TriangleExample) {
    

    //bindings to C++ functions
    var Bindings = (function () {
        function Bindings() {
        }
        Bindings.initGL = Module.cwrap('initGL', 'number', ['number', 'number']);
        Bindings.drawTriangle = Module.cwrap('drawTriangle', '', ['number']);
        return Bindings;
    })();

    //a helper for some JS-to-Emscripten conversions
    var HeapUtils = (function () {
        function HeapUtils() {
        }
        HeapUtils.floatArrayToHeap = function (arr) {
            var arrayPointer = _malloc(arr.length * 4);
            for (var i = 0; i < arr.length; i++)
                Module.setValue(arrayPointer + i * 4, arr[i], 'float');
            return arrayPointer;
        };
        return HeapUtils;
    })();

    //our program that draws a triangle
    var Program = (function () {
        function Program(canvas) {
            this.canvas = canvas;
            //current translation of the triangle
            this.translation = { originX: 0, originY: 0, zoom: 1.0 };
            //initialise the GL context, call the compiled native function
            var initialised = Bindings.initGL(canvas.width, canvas.height);
            if (!initialised) {
                console.log("Could not initialise GL");
                return;
            }

            //get the mouse listen to canvas mouse events
            this.mouseController = new TriangleExample.MouseController(canvas, this);

            //request redraw
            this.invalidate();
        }
        //translate the whole GL scene by offset
        Program.prototype.pan = function (offset) {
            var glOffset = {
                x: offset.x / this.canvas.width * 2.0 / this.translation.zoom,
                y: offset.y / this.canvas.height * 2.0 / this.translation.zoom
            };
            this.translation.originX += glOffset.x;
            this.translation.originY -= glOffset.y;
            this.invalidate();
        };

        //zoom by the given ratio
        Program.prototype.zoom = function (ratio, origin) {
            this.translation.zoom *= ratio;
            this.invalidate();
        };

        //render the scene
        Program.prototype.render = function () {
            //convert the JS translation object to an emscripten array of floats
            var translationPtr = HeapUtils.floatArrayToHeap([this.translation.originX, this.translation.originY, this.translation.zoom]);

            //call the native draw function
            Bindings.drawTriangle(translationPtr);

            //free the array memory
            _free(translationPtr);
        };

        Program.prototype.invalidate = function () {
            window.requestAnimationFrame(this.render.bind(this));
        };
        return Program;
    })();
    TriangleExample.Program = Program;
})(TriangleExample || (TriangleExample = {}));
