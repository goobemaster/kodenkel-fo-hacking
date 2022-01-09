
export class CachedJSONData {
    private filename: string;
    private data: {[index: string]: string|string[]};

    constructor(url: string) {
        this.filename = url.substring(url.lastIndexOf('/') + 1);
        let dataInStorage: {[index: string]: string} = JSON.parse(window.localStorage.getItem(this.filename));

        if (dataInStorage !== null) {
            this.data = dataInStorage;
            return;
        }

        (async () => {
            await fetch(url).then(v => {
                v.text().then(text => {
                    dataInStorage = JSON.parse(text);
                    window.localStorage.setItem(this.filename, JSON.stringify(dataInStorage));
                    this.data = dataInStorage;
                })
            });
        })();
    }

    public getStringByKey(key: string): string {
        return this.data[key] as string;
    }

    public getArrayByKey(key: string): string[] {
        return this.data[key] as string[];
    }
}