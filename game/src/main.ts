import * as PIXI from 'pixi.js';
const Application = PIXI.Application;
const Graphics = PIXI.Graphics;
import { initDevtools } from '@pixi/devtools';

(async () => {
    const app = new Application();
    await app.init({
        width: 640*2,
        height: 360*2,
        backgroundColor: "white"
    });
    document.body.appendChild(app.canvas);
    initDevtools(app);

    const birdTexture = await PIXI.Assets.load('/public/sprite.png'); // Assurez-vous que le chemin est correct
    const bird = new PIXI.Sprite(birdTexture);
    bird.height = 100 / 3;
    bird.width = 170 / 3;
    bird.x = app.screen.width / 4;
    bird.y = app.screen.height / 2;
    bird.anchor.set(0.5);
    app.stage.addChild(bird);

    let velocity = 0;
    const gravity = 0.5;
    const jumpStrength = -10;
    let gameOver = false;


    const questions = [
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctIndex: 0 },
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctIndex: 0 },
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctIndex: 0 },
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctIndex: 0 },
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctIndex: 0 },
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctIndex: 0 },
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctIndex: 0 },
    ];

    function initWalls(question: any) {
        let walls: any = []
        let texts: any = []
        const wallTexture = PIXI.Texture.WHITE;
        for (let i = 0; i < 4; i++) {
            const wall = new PIXI.Sprite(wallTexture);
            wall.tint = 0x000000; // Set color to black
            wall.width = 50; // Set the width of the wall
            wall.height = 50; // Set the height of the wall
            wall.x = app.screen.width; // Start the wall off screen to the right with a gap of a quarter of the screen
            wall.y = (app.screen.height - wall.height) * i/3; // Position the wall vertically randomly
            walls.push(wall)
            app.stage.addChild(wall);
            const text = new PIXI.Text(question.answers[i], { fontSize: 15, fill: "black" });
            text.x = wall.x;
            text.y = wall.y + wall.height - 150;
            texts.push(text)
            app.stage.addChild(text);
        }
        return {'walls': walls, 'texts': texts}
    }

    let walls = initWalls(questions[0]);
    let roundFinished = false;
    let stopScrolling = false
    let stopScrollTime = 0

    // Fonction pour générer les murs
    app.ticker.add((delta: any) => {
        if (gameOver) return;

        console.log('Status roundfinished: ', roundFinished)

        if (roundFinished) {
            console.log('Round fini! ')
            const nextQuestion = questions.shift();
            if (!nextQuestion) {
                console.log('Jeu Fini! ')
                gameOver = true;
                return;
            }
            roundFinished = false;
            walls = initWalls(nextQuestion);
        }

        if (bird.x + 100 === walls['walls'][0].x && stopScrollTime <= 300) {
            console.log('NEAR!')

            if (!stopScrolling) {
                stopScrolling = true
            }
            stopScrollTime += 1
            if (stopScrollTime === 300) {
                stopScrolling = false
                stopScrollTime = 0
            }
            console.log('stopScrollTime: ', stopScrollTime)
        }

        if (!stopScrolling) {
            walls['walls'].forEach((wall: any) => {
                wall.x -= 5; // Move each wall to the left
                if (wall.x + wall.width < -100) {
                    app.stage.removeChild(wall); 
                    roundFinished = true;               
                }
            });

            walls['texts'].forEach((text: any) => {
                text.x -= 5; 
                if (text.x + text.width < -100) {
                    app.stage.removeChild(text); 
                    roundFinished = true;
                }
           });
        }   

        velocity += gravity;
        bird.y += velocity;

        if (bird.y <= 0) { bird.y = 0; velocity = 0; }
        if (bird.y >= app.screen.height - bird.height) { bird.y = app.screen.height - bird.height; velocity = 0; }
    });



    document.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            velocity = jumpStrength;
        }
    });

})();

