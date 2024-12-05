const NUMBER_OF_SPRITES = 4;
import * as PIXI from 'pixi.js';
import { sound } from '@pixi/sound';
const Application = PIXI.Application;
import { initDevtools } from '@pixi/devtools';

// Initialisation des données
// Année x nombre de morts
const avilable_names_response = await fetch('https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?field=prenom&size=1&agg_size=1000');
const avilable_names_json = await avilable_names_response.json()
const availableNames = avilable_names_json['aggs'].map((item: any) => item.value);

sound.add('gun', '/gun.mp3');
sound.add('headshot', '/headshot.m4a');

const response = await fetch('https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?qs=(prenom:(%22MARGUERITE%22))&size=0&field=date_mort&interval=year&agg_size=100&sort=date_mort&finalizedAt=2024-11-15T23:23:27.104Z');
const datas = await response.json();
let data: any = datas['aggs'].map((bucket: any) => ({
    x: new Date(bucket.value).getFullYear(),
    y: bucket.total
}));

console.log('Data: ', data);
(async () => {
    const app = new Application();
    await app.init({
        width: 640 * 3.7,
        height: 400 * 2,
        background: "white"
    });

    document.body.appendChild(app.canvas);
    initDevtools(app);
    await PIXI.Assets.load('https://pixijs.com/assets/spritesheet/mc.json');
    const explosionTextures: any = [];
    for (let i = 0; i < 26; i++) {
        const texture = PIXI.Texture.from(`Explosion_Sequence_A ${i + 1}.png`);
        explosionTextures.push(texture);
    }
    const sprite = new PIXI.AnimatedSprite(explosionTextures);

    const gun_texture = await PIXI.Assets.load('/gun.png');
    const gun = new PIXI.Sprite(gun_texture);
    gun.x = 600;
    gun.y = 400;
    gun.angle = 20;
    app.stage.addChild(gun);
    app.stage.interactive = true;

    const background_texture = await PIXI.Assets.load('/jail.jpg');
    const background = new PIXI.Sprite(background_texture);
    background.width = app.renderer.width;
    background.height = app.renderer.height;
    app.stage.addChildAt(background, 0);

    const textures = await PIXI.Assets.load('/point.png');

    const graphics: any = [];
    for (let i = 0; i < NUMBER_OF_SPRITES; i++) {
        const graphic = new PIXI.Sprite(textures);
        graphic.label = `Graphics ${i}`;
        graphic.height = 50;
        graphic.width = 50;
        app.stage.addChild(graphic);
        graphics.push(graphic);
    }

    const graphicsDatas: any = [];
    for (let i = 0; i < NUMBER_OF_SPRITES; i++) {
        let name = availableNames[Math.floor(Math.random() * availableNames.length)];
        let response = await fetch(`https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?qs=(prenom:(%22${name}%22))&size=0&field=date_mort&interval=year&agg_size=100&sort=date_mort&finalizedAt=2024-11-15T23:23:27.104Z`);
        let datas = await response.json();
        let graphicsData = datas['aggs'].reduce((acc: any[], bucket: any) => {
            const yearData = {
                x: new Date(bucket.value).getFullYear(),
                y: bucket.total
            };
            if (yearData.x >= 1970) {
                acc.push(yearData);
            }
            return acc;
        }, []);
        graphicsDatas.push(graphicsData);
    }

    let points = 0;

    let graphicsDirections = [1, -1, 1, -1];
    let graphicsPoints = [1, 1, 1, 1];

    let shoot = 0

    let newDatasRequired = [false, false, false, false];

    app.ticker.maxFPS = 60; // Adjusted FPS for smoother animation

    const delta = 0.5;
    app.ticker.add(() => {
        for (let i = 0; i < NUMBER_OF_SPRITES; i++) {
            if (graphics[i].x >= app.renderer.width + 100) {
                graphicsDirections[i] = -1;
                graphicsPoints[i] = 1;
            }
            if (graphics[i].x <= -100) {
                graphicsDirections[i] = 1;
                graphicsPoints[i] = 1;
            }

            graphics[i].x += graphicsDirections[i] * delta * (app.renderer.width / graphicsDatas[i].length) * 0.5;

            try {
                const targetY = (graphicsDatas[i][graphicsPoints[i]].y / app.renderer.height * 400) + 100;
                graphics[i].y += (targetY - graphics[i].y) * delta * 0.25;
            } catch (error) {
                console.error('Erreur lors du calcul de la position y:', error);
            }

            graphicsPoints[i] += 1;
            if (newDatasRequired[i]) {
                newDatasRequired[i] = false;
                let name = availableNames[Math.floor(Math.random() * availableNames.length)];
                document.getElementById('name')!.innerHTML = name;
                fetch(`https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?qs=(prenom:(%22${name}%22))&size=0&field=date_mort&interval=year&agg_size=100&sort=date_mort&finalizedAt=2024-11-15T23:23:27.104Z`)
                    .then(response => response.json())
                    .then(datas => {
                        graphicsDatas[i] = datas['aggs'].reduce((acc: any[], bucket: any) => {
                            const yearData = {
                                x: new Date(bucket.value).getFullYear(),
                                y: bucket.total
                            };
                            if (yearData.y >= 5) {
                                acc.push(yearData);
                            }
                            return acc;
                        }, []);
                    })
                    .catch(error => {
                        console.error('Erreur de récupération des données:', error);
                    });
            }
        }
    });

    for (let i = 0; i < NUMBER_OF_SPRITES; i++) {
        graphics[i].interactive = true;
        graphics[i].on('click', (event: any) => {
            console.log('Clicked');
            if (!sprite.playing) {
                sound.play('headshot');
                points += 1;
                graphicsDirections[i] = -graphicsDirections[i];
                graphics[i].x = graphicsDirections[i] * 2500;
                newDatasRequired[i] = true;
                let destory = new PIXI.AnimatedSprite(explosionTextures);
                destory.anchor.set(0.5);
                destory.x = event.data.global.x;
                destory.y = event.data.global.y;
                destory.play();
                app.stage.addChild(destory);
                setTimeout(() => {
                    app.stage.removeChild(destory);
                }, 500);
                document.getElementById('points')!.innerHTML = `${points} points`;
            }
        });
    }

    app.canvas.onclick = () => {
        shoot += 1
        sound.play('gun');
        let destory = new PIXI.AnimatedSprite(explosionTextures);
        destory.anchor.set(0.5);
        destory.x = 890;
        destory.y = 585;
        destory.animationSpeed = 0.1;
        destory.play();
        app.stage.addChild(destory);
        setTimeout(() => {
            app.stage.removeChild(destory);
        }, 100);
    };

    let end_time = new Date(Date.now() + 50000);
    app.ticker.add(() => {
        let time_left = Math.max(0, end_time.getTime() - Date.now());
        document.getElementById('points_finished')!.innerHTML = `${points} points et tu fais ${Math.round(points / 50)} kills par seconde, avec une précision de ${Math.round((points / shoot) * 100)}%`;
        let stars: any = document.querySelector('.stars');
        stars.innerHTML = '';
        if (points >= 25) {
            stars.innerHTML += '*';
        }
        if (points >= 15) {
            stars.innerHTML += '*';
        }
        if (points >= 10) {
            stars.innerHTML += '*';
        }
        if (time_left <= 0) {
            const finished_menu: any = document.querySelector('.finished_menu');
            finished_menu.style.height = '60%';
            app.ticker.stop();
        }
    });
})();

