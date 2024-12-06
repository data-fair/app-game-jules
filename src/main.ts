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
        width: 640*3.91,
        height: 400*2,
        background: "white"
    });

    document.body.appendChild(app.canvas)
    initDevtools(app)
    await PIXI.Assets.load('https://pixijs.com/assets/spritesheet/mc.json')
    const explosionTextures: any = []
    for (let i = 0; i < 26; i++) {
        let i;
        for (i = 0; i < 26; i++)
        {
            const texture = PIXI.Texture.from(`Explosion_Sequence_A ${i + 1}.png`)
            explosionTextures.push(texture)
        }
    }
    const sprite = new PIXI.AnimatedSprite(explosionTextures);

    // Le gun
    const gun_texture = await PIXI.Assets.load('/gun.png')
    const gun = new PIXI.Sprite(gun_texture)
    gun.x = 600
    gun.y = 400
    gun.angle = 20
    app.stage.addChild(gun)
    app.stage.interactive = true

    const background_texture = await PIXI.Assets.load('/jail.jpg')
    const background = new PIXI.Sprite(background_texture)
    background.width = app.renderer.width
    background.height = app.renderer.height
    app.stage.addChildAt(background, 0)

    const textures = await PIXI.Assets.load('/point.png')
    const graphics1 = new PIXI.Sprite(textures)
    const graphics2 = new PIXI.Sprite(textures)
    graphics1.height = graphics2.height = 50
    graphics1.width = graphics2.width = 50
    app.stage.addChild(graphics1)
    app.stage.addChild(graphics2)

    graphics1.anchor.set(0.5, 0.5)
    graphics2.anchor.set(0.5, 0.5)

    graphics2.x = 2000

    let name_1 = availableNames[Math.floor(Math.random() * availableNames.length)]
    let response_1 = await fetch(`https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?qs=(prenom:(%22${name_1}%22))&size=0&field=date_mort&interval=year&agg_size=100&sort=date_mort&finalizedAt=2024-11-15T23:23:27.104Z`);
    let datas_1 = await response_1.json()

    let name_2 = availableNames[Math.floor(Math.random() * availableNames.length)];
    let response_2 = await fetch(`https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?qs=(prenom:(%22${name_2}%22))&size=0&field=date_mort&interval=year&agg_size=100&sort=date_mort&finalizedAt=2024-11-15T23:23:27.104Z`);
    let datas_2 = await response_2.json()
    let graphics_2_datas: any = datas_2['aggs'].map((bucket: any) => ({
        x: new Date(bucket.value).getFullYear(),
        y: bucket.total
    }));

    let points = 0
    let game_finished = false

    let graphics1_direction = 1
    let graphics2_direction = -1

    let graphics1_points = 1
    let graphics2_points = 1

    let newDatasRequired1 = false
    let newDatasRequired2 = false

    app.ticker.maxFPS = 10

    let killeds = []
    let shoot = 0

    // Initialisation des premières données
    let graphics_1_datas = datas_1['aggs'].reduce((acc: any[], bucket: any) => {
        const yearData = {
            x: new Date(bucket.value).getFullYear(),
            y: bucket.total
        };
        if (yearData.x >= 1970) {
            acc.push(yearData);
        }
        return acc;
    }, []);



    // Déplacements du sprite 1
    app.ticker.add( () => {
        ///////////////////////////////////////////////////////////////: CODE DE GESTION DU SPRITE 1 :///////////////////////////////////////////////////////////////
        // Detection de fin de course
        if (graphics1.x >= app.renderer.width + 100) {
            graphics1_direction = -1
            newDatasRequired1 = true
            graphics1_points = 1;
        }
        if (graphics1.x <= -50) {
            graphics1_direction = 1
            newDatasRequired1 = true
            graphics1_points = 1;
        }

        // Changer la velurs de division pour modifier le "degré de smooth"
        // Déplacements
        for (let i = 0; i < 4; i++) {
            graphics1.x += graphics1_direction * (app.renderer.width / graphics_1_datas.length) / 4;
            new Promise(resolve => setTimeout(resolve, 10));
        }
        
        try {
            if (newDatasRequired1 === false) { 
                graphics1.y += (graphics_1_datas[graphics1_points].y / app.renderer.height * 400 + 100 - graphics1.y) * 0.5;
            }
        } catch (error) {
            console.error('Erreur lors du calcul de la position y:', error);
        }

        // Mise à jour de la valeur des points
        graphics1_points += 1;        

        document.getElementById('points')!.innerHTML = `${points} points`

        if (newDatasRequired1) {
            newDatasRequired1 = false;
            name_1 = availableNames[Math.floor(Math.random() * availableNames.length)];
            fetch(`https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?qs=(prenom:(%22${name_1}%22))&size=0&field=date_mort&interval=year&agg_size=100&sort=date_mort&finalizedAt=2024-11-15T23:23:27.104Z`)
                .then(response => response.json())
                .then(datas_1 => {
                    graphics_1_datas = datas_1['aggs'].reduce((acc: any[], bucket: any) => {
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
        }

        ///////////////////////////////////////////////////////////////: CODE DE GESTION DU SPRITE 2 :///////////////////////////////////////////////////////////////
        // Detection de fin de course
        if (graphics2.x >= app.renderer.width + 100) {
            graphics2_direction = -1
            newDatasRequired1 = true
            graphics2_points = 1;
        }
        if (graphics2.x <= -50) {
            graphics2_direction = 1
            newDatasRequired1 = true
            graphics2_points = 1;
        }


        // Déplacements
        for (let i = 0; i < 4; i++) {
            graphics2.x += graphics2_direction * (app.renderer.width / graphics_2_datas.length) / 4;
            new Promise(resolve => setTimeout(resolve, 10));
        }

        if (graphics2_points < graphics_2_datas.length) {
            try {
                graphics2.y += (graphics_2_datas[graphics2_points].y / app.renderer.height * 400 + 100 - graphics2.y) * 0.5;
            } catch (error) {
                console.error('Erreur lors du calcul de la position y:', error);
            }
        }

        // Mise à jour de la valeur des points
        graphics2_points += 1;        
        if (newDatasRequired2) {
            newDatasRequired2 = false;
            console.log(availableNames)
            name_2 = availableNames[Math.floor(Math.random() * availableNames.length)];
            while (killeds.includes(name_2)) {
                name_2 = availableNames[Math.floor(Math.random() * availableNames.length)];
            }
            console.log('New name: ', name_2)
            document.getElementById('name')!.innerHTML = name_2;
            fetch(`https://koumoul.com/data-fair/api/v1/datasets/fichier-personnes-decedees/values_agg?qs=(prenom:(%22${name_2}%22))&size=0&field=date_mort&interval=year&agg_size=100&sort=date_mort&finalizedAt=2024-11-15T23:23:27.104Z`)
                .then(response => response.json())
                .then(datas_2 => {
                    graphics_2_datas = datas_2['aggs'].reduce((acc: any[], bucket: any) => {
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
})

graphics1.interactive = true;
graphics1.on('click', (event) => {
    graphics1.x = 0
    killeds.push(name_1)
    console.log(name_1)
    if (!sprite.playing && !game_finished) {
        points += 1
        graphics1_direction = -graphics1_direction  
        graphics1.x = 0
        newDatasRequired1 = true
        let destory = new PIXI.AnimatedSprite(explosionTextures);
        destory.anchor.set(0.5);
        destory.x = event.data.global.x;
        destory.y = event.data.global.y;
        destory.play();
        app.stage.addChild(destory);
        setTimeout(() => {
            app.stage.removeChild(destory);
        }, 500);
        document.getElementById('points')!.innerHTML = `${points} points`
    }
})

graphics2.interactive = true;
graphics2.on('click', (event) => {
    killeds.push(name_2)
    if (!sprite.playing && !game_finished) {
        points += 1
        graphics2_direction = -graphics2_direction  
        graphics2.x = 3000
        newDatasRequired2 = true
        let destory = new PIXI.AnimatedSprite(explosionTextures);
        destory.anchor.set(0.5);
        destory.x = event.data.global.x;
        destory.y = event.data.global.y;
        destory.play();
        app.stage.addChild(destory);
        setTimeout(() => {
            app.stage.removeChild(destory);
        }, 500);
        document.getElementById('points')!.innerHTML = `${points} points`
    }
})
    app.canvas.onclick = () => {
        if (game_finished) return
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

    let end_time = new Date(Date.now() + 20000);
    app.ticker.add(() => {
        let time_left = Math.max(0, end_time.getTime() - Date.now());
        document.getElementById('points_finished')!.innerHTML = `${points} points et tu fais ${(points / 50)} kills par seconde, avec une précision de ${Math.round((points / shoot) * 100)}%`;
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
            game_finished = true
            const finished_menu: any = document.querySelector('.finished_menu');
            finished_menu.style.height = '60%';

            console.log(killeds)
            killeds = killeds.filter((item, index) => killeds.indexOf(item) === index);            

            const killed_names: any = document.querySelector('#killeds');
            killed_names.innerHTML = '<tr><th>Vous avez tué... </th></tr>';
            for (let i = 0; i < killeds.length; i++) {
                killed_names.innerHTML += `<tr><td>${killeds[i]}</td></tr>`;
            }

            app.ticker.stop();
        }
    });
})();

