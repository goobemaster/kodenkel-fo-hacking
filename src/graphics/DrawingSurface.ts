
export class DrawingSurface {
    private static readonly clearBackgroundColor: string = 'black';

    private readonly width: number;
    private readonly height: number;
    private canvasElement: HTMLCanvasElement;
    private parentElement: HTMLElement;
    private context: CanvasRenderingContext2D;

    constructor(width: number, height: number, id: string) {
        this.width = width;
        this.height = height;

        if (document.querySelector('#' + id) !== null) {
            throw new Error(`Element id "${id}" is already in use!`);
        }

        this.canvasElement = document.createElement('canvas');
        this.canvasElement.setAttribute('width', width.toString());
        this.canvasElement.setAttribute('height', height.toString());
        this.canvasElement.setAttribute('id', id);
        this.parentElement = document.querySelector('#border');
        this.parentElement.appendChild(this.canvasElement);

        this.context = this.canvasElement.getContext('2d');
        this.clear();
    }

    public registerFont(name: string) {
        let customFont = new FontFace(name, `url(assets/fonts/${name}.ttf)`);

        customFont.load().then(function(font) {
            // @ts-ignore
            document.fonts.add(font);
        });
    }

    public getCanvasElement(): HTMLCanvasElement {
        return this.canvasElement;
    }

    public getWidth(): number {
        return this.width;
    }

    public getHeight(): number {
        return this.height;
    }

    public clear() {
        this.context.fillStyle = DrawingSurface.clearBackgroundColor;
        this.context.clearRect(0, 0, this.width, this.height);
    }

    public drawText(text: string, positionX: number, positionY: number, font: string = 'serif', fontSize: number = 12, color: string = 'white') {
        this.context.fillStyle = color;
        this.context.font = `${fontSize.toString()}px '${font}'`;
/*         this.context.textAlign = align; */
        this.context.fillText(text, positionX, positionY);
    }

    public drawRectangle(x: number, y: number, width: number, height: number, color: string = 'white') {
        this.context.fillStyle = color;
        this.context.fillRect(x, y, width, height);
    }

    public drawImage(image: HTMLImageElement, positionX: number, positionY: number, width: number = null, height: number = null) {
        if (width === null) width = image.width;
        if (height === null) height = image.height;
        this.context.drawImage(image, positionX, positionY, width, height);
    }

    public onMouseMove(handler: (event: MouseEvent) => void) {
        this.canvasElement.addEventListener('mousemove', handler);
    }

    public onClick(handler: (event: MouseEvent) => void) {
        this.canvasElement.addEventListener('click', handler);
    }
}    

