module TriangleExample {
    declare var $;

    export interface Point {
        x: number;
        y: number;
    }

    export interface IPanZoomable {
        pan(offset: Point);
        zoom(ratio: number, origin: Point);
    }

    export class MouseController {
        isMouseDown = false;
        lastMouseCoord: Point = null;
        zoomSensitivity: number = 2.0;

        constructor(private canvas: HTMLCanvasElement, private area: IPanZoomable) {
            $(canvas).mousewheel(this.onMouseWheel.bind(this));
            canvas.onmousedown = this.onMouseDown.bind(this);
            canvas.onmouseup = this.onMouseUp.bind(this);
            canvas.onmousemove = this.onMouseMove.bind(this);
            canvas.onmouseleave = this.onMouseLeave.bind(this);
        }

        private getLocalCoord(ev: MouseEvent): Point {
            return { x: ev.clientX - this.canvas.offsetLeft, y: ev.clientY - this.canvas.offsetTop };
        }

        onMouseDown(ev: MouseEvent) {
            var e = this.getLocalCoord(ev);
            this.isMouseDown = true;
            this.lastMouseCoord = e;
        }

        onMouseUp(ev: MouseEvent) {
            var e = this.getLocalCoord(ev);
            this.isMouseDown = false;
            this.lastMouseCoord = null;
        }

        onMouseMove(ev: MouseEvent) {
            var e = this.getLocalCoord(ev);
            if (this.isMouseDown) {
                var offset = { x: e.x - this.lastMouseCoord.x, y: e.y - this.lastMouseCoord.y };
                this.lastMouseCoord = e;
                this.area.pan(offset);
            }
        }

        onMouseLeave(ev: MouseEvent) {
            this.isMouseDown = false;
        }

        onMouseWheel(ev: any) {
            ev.wheelDelta = ev.deltaY * 120.0;
            var e = this.getLocalCoord(ev);
            this.area.zoom(1.0 + ev.wheelDelta / 1200.0 * this.zoomSensitivity, e);
            return false;
        }
    }
}