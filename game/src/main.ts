import * as PIXI from 'pixi.js';
const Application = PIXI.Application;
const Graphics = PIXI.Graphics;
import { initDevtools } from '@pixi/devtools';

function shuffle(array: []) {
    for (let i = array.length - 1; i > 0; i--) {
        // Generate a random index between 0 and i
        const j = Math.floor(Math.random() * (i + 1));
        // Swap the elements at indices i and j
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const difficulty = 1;

(async () => {
    const app = new Application();
    await app.init({
        width: 640*2.9,
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
    const jumpStrength = difficulty*-5;
    let gameOver = false;


    const questions = [
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctAnswer: "Paris" },
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctAnswer: "Paris" },
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctAnswer: "Paris" },
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctAnswer: "Paris" },
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctAnswer: "Paris" },
        { question: "Quelle est la capitale de la France ?", answers: ["Paris", "Londres", "Berlin"], correctAnswer: "Paris" },
    ];

    function initWalls(question: any) {
        let walls: any = []
        let texts: any = []
        const wallTexture = PIXI.Texture.WHITE;
        const shuffledAnswers = shuffle(question.answers)
        for (let i = 0; i < 4; i++) {
            const wall = new PIXI.Sprite(wallTexture);
            wall.tint = 0x000000; // Set color to black
            wall.width = 100; // Set the width of the wall
            wall.height = 50; // Set the height of the wall
            wall.x = app.screen.width; // Start the wall off screen to the right with a gap of a quarter of the screen
            wall.y = (app.screen.height - wall.height) * i/3; // Position the wall vertically randomly
            walls.push(wall)
            app.stage.addChild(wall);
            if (i !== 0) {
                console.log(i)
                const text = new PIXI.Text(shuffledAnswers[i-1], { fontSize: 15, fill: "black" });
                text.x = wall.x;
                text.y = wall.y + wall.height - 150;
                texts.push(text);
                app.stage.addChild(text);
            }
        }
        return {'walls': walls, 'texts': texts, 'correct': question.correctAnswer}
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
        console.log('BIRD (x): ', bird.x, 'WALL (x): ', walls['walls'][0].x)
        if (bird.x + 67 === walls['walls'][0].x && stopScrollTime <= 300) {
            if (!stopScrolling) {
                stopScrolling = true
            }
            stopScrollTime += 1
            if (stopScrollTime === 300) {
                stopScrolling = false
                stopScrollTime = 0

                // Temps de choix fini
                for (let i = 0; i < walls['texts'].length; i++) {
                    if (walls['texts'][i].text === walls['correct']) {
                        console.log('Great answer: ', walls['texts'][i].text)
                    } else {
                        const wrongAnswerWall = new PIXI.Sprite(PIXI.Texture.WHITE);
                        wrongAnswerWall.tint = "black";
                        wrongAnswerWall.width = 100; 
                        wrongAnswerWall.height = 200; 
                        wrongAnswerWall.x = walls['texts'][i].x;
                        wrongAnswerWall.y = walls['texts'][i].y - 100;
                        wrongAnswerWall.alpha = 0;
                        app.stage.addChild(wrongAnswerWall);
                        walls.walls.push(wrongAnswerWall)

                        app.ticker.add(() => {
                            if (wrongAnswerWall.alpha < 1) {
                                wrongAnswerWall.alpha += 0.05;
                            }
                        })
                    }
                }
            
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

        walls['walls'].forEach((wall: any) => {
            if (bird.x < wall.x + wall.width &&
                bird.x + bird.width > wall.x &&
                bird.y < wall.y + wall.height &&
                bird.y + bird.height > wall.y) {
                    console.log('Collision detected!');
                    gameOver = true;
                const gameOverText = new PIXI.Text('Oh non! Vous avez perdu.', { fontFamily: 'Comic Sans MS', fontSize: 50, fill: 0xff0000, fontWeight: 'bold' });
                gameOverText.x = (app.screen.width - gameOverText.width) / 2;
                gameOverText.y = (app.screen.height - gameOverText.height) / 2;
                app.stage.addChild(gameOverText);
                }
            });

    });



    document.addEventListener('keydown', (event) => {
        if (event.key === ' ') {
            velocity = jumpStrength;
        }
    });

})();

