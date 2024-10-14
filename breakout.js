const canvas = document.getElementById('breakout');
const ctx = canvas.getContext('2d');
document.addEventListener('keydown', keyDownHandler);
document.addEventListener('keyup', keyUpHandler);
document.addEventListener("mousemove", mouseMoveHandler)

let game = {    
    requestId: null,
    timeoutId: null,
    leftKey: false,
    rightKey: false,
    on: false,
    music: true,
    sfx: true
}
let paddle = {
    height: 20,
    width: 100,
    get y() { return canvas.height - this.height; }
}
let ball = {
    radius: 10,
    color: 0
};
let balls = [];

let brick = {
    rows: 5,
    cols: 10,
    get width() { return canvas.width / this.cols; },
    height: 30
}
let images = {
    background: new Image(),
    ball: new Image(),
    paddle: new Image(),
    heart: new Image()
}

let bricks = {};

let is_game_started = false;

let backgrounds = [
    './images/background/1.webp',
    './images/background/2.webp',
    './images/background/3.webp',
    './images/background/4.webp',
    './images/background/5.webp',
    './images/background/6.webp',
    './images/background/7.webp',
    './images/background/8.webp',
    './images/background/9.webp',
    './images/background/10.webp',
];

let balls_list = [];

let sounds_list = [
    './sounds/background/1.mp3',
    './sounds/background/2.mp3',
    './sounds/background/3.mp3',
    './sounds/background/4.mp3',
    './sounds/background/5.mp3',
    './sounds/background/6.mp3',
    './sounds/background/7.mp3',
    './sounds/background/8.mp3',
    './sounds/background/9.mp3',
    './sounds/background/10.mp3',
];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function onImageLoad(e) {
    if (is_game_started) {
        return;
    }
    resetGame();
    initBricks();
    resetPaddle();
    paint();
    ctx.font = '50px ArcadeClassic';
    ctx.fillStyle = 'lime';
    ctx.fillText('PRESS SPACE TO START', canvas.width / 4.5, canvas.height / 2);
};

for (let i = 0; i < 6; i++) {
    bricks[i] = new Image();
    bricks[i].src = `./images/bricks/${i}.webp`;
}

for (let i = 0; i < 4; i++) {
    balls_list[i] = new Image();
    balls_list[i].src = `./images/balls/${i}.webp`;
}

images.background.addEventListener('load', onImageLoad);
images.background.src = backgrounds[0];
images.paddle.src = './images/paddle.webp';
images.heart.src = './images/heart.webp';


let sounds = {
    ballLost: new Audio('./sounds/ball-lost.mp3'),
    breakout: new Audio('./sounds/breakout.mp3'),
    brick: new Audio('./sounds/brick.mp3'),
    gameOver: new Audio('./sounds/game-over.mp3'),
    levelCompleted: new Audio('./sounds/level-completed.mp3'),
    music: new Audio(sounds_list[0]),
    paddle: new Audio('./sounds/paddle.mp3'),
    buff: new Audio('./sounds/buff.mp3'),
    debuff: new Audio('./sounds/debuff.mp3')
}

let brickField = [];

function play() {   
    cancelAnimationFrame(game.requestId);
    clearTimeout(game.timeoutId);
    game.on = true;

    resetGame();
    resetBall();
    resetPaddle();
    initBricks();

    is_game_started = true;
    game.sfx && sounds.breakout.play();
    // Start music after starting sound ends.
    setTimeout(() => game.music && sounds.music.play(), 2000);

    animate();
}

function resetGame() {
    game.speed = 7;
    game.score = 0;
    game.level = 1;
    game.lives = 3;
    game.time = { start: performance.now(), elapsed: 0, refreshRate: 16  };
}

function initSounds() {
    sounds.music.loop = true;
    for (const [key] of Object.entries(sounds)) {
        sounds[key].volume = 0.5;
    }
}

function resetBall() {
    ball.x = paddle.x;
    ball.y = canvas.height - paddle.height - 2 * ball.radius;
    ball.dx = game.speed * (Math.random() * 2 - 1);  // Random trajectory
    ball.dy = -game.speed; // Up
    balls.push(structuredClone(ball));
}

function resetPaddle() {
    paddle.width = 100;
    paddle.x = (canvas.width - paddle.width) / 2;
    paddle.dx = game.speed + 7;
}

function initBricks() {
    brickField = [];
    const topMargin = 30;

    for(let row = 0; row < brick.rows; row++) {
        for(let col = 0; col < brick.cols; col++) {
            brickField.push({
                opacity: 1,
                x: col * brick.width,
                y: row * brick.height + topMargin,
                height: brick.height,
                width: brick.width,
                type: row % 6,
                buff: getRandomBuff(),
                points: (5 - row) * 2,
                hitsLeft: row === 0 ? 2 : 1
            });
        }
    }
}

function getRandomBuff() {
    let tmp = Math.random();

//    if (tmp < 0.2) { return "extendPuddle" };
//    if (tmp < 0.4) { return "cutPuddle" };
//    if (tmp < 0.5) { return "increaseSpeed" };
//    if (tmp < 0.6) { return "decreaseSpeed" };
    if (tmp < 0.8) { return "decreaseSize" };
    if (tmp < 1) { return "addBalls"};

    return null
}

function makeBuff(brick_buff) {
    switch (brick_buff) {
        case "extendPuddle":
            game.sfx && sounds.buff.play();
            paddle.width *= paddle.width > 100 ? 1.2 : 2;
            if (paddle.width > 250) { paddle.width = 250 };
            break;
        case "cutPuddle":
            game.sfx && sounds.debuff.play();
            paddle.width *= paddle.width < 150 ? 0.9 : 0.5;;
            if (paddle.width < 50) { paddle.width = 50 };
            break;
        case "increaseSpeed":
            game.sfx && sounds.debuff.play();
            game.speed += 0.5;
            break;
        case "decreaseSpeed":
            game.sfx && sounds.buff.play();
            game.speed -= 0.5;
            break
        case "decreaseSize":
            balls.forEach((ball) => {
                    ball.radius *= getRandomInt(2);
                    ball.radius += 1;
                    ball.radius = Math.max(ball.radius, 10)
                });
            break
        case "addBalls":
            if (balls.length <= 5)
            {
                resetBall();
                ball.color = getRandomInt(4);
                balls.push(structuredClone(ball));
            }
            else {console.log(balls.length)};
            break;
        default:
            break;
    }
    return;
}

function animate(now = 0) { 
    game.time.elapsed = now - game.time.start;
    if (game.time.elapsed > game.time.refreshRate) {
        game.time.start = now;

        paint();
        update();
        detectCollision();
        detectBrickCollision();
    
        if (isLevelCompleted() || isGameOver()) return;
    }    

    game.requestId = requestAnimationFrame(animate);
}

function paint() {
    ctx.drawImage(images.background, 0, 0, canvas.width, canvas.height);
    balls.forEach((ball) => {
        ctx.drawImage(balls_list[ball.color], ball.x, ball.y, 2 * ball.radius, 2 * ball.radius);
    });
    ctx.drawImage(images.paddle, paddle.x, paddle.y, paddle.width, paddle.height);
    drawBricks();
    drawScore();
    drawLives();
}

function update() {
    balls = balls.filter(ball => ball.y - 2 * ball.radius <= canvas.height);
    for (var i = 0; i < balls.length; i++) {
      balls[i].x += balls[i].dx;
      balls[i].y += balls[i].dy;
    }

    paddle.x = balls[0].x - paddle.width / 2;

    if (game.rightKey) {
        paddle.x += paddle.dx;
        if (paddle.x + paddle.width > canvas.width){
            paddle.x = canvas.width - paddle.width;
        }
    }
    if (game.leftKey) {
        paddle.x -= paddle.dx;
        if (paddle.x < 0){
            paddle.x = 0;
        }
    }

}

function drawBricks() {
    brickField.forEach((brick) => {
      if (brick.hitsLeft) {
        ctx.save();
        ctx.globalAlpha = brick.opacity;
        ctx.drawImage(bricks[brick.type], brick.x, brick.y, brick.width, brick.height);
        ctx.restore()
        ctx.strokeStyle = "white";
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    });
  }

function drawScore() {
    ctx.font = '24px ArcadeClassic';
    ctx. fillStyle = 'white';
    const { level, score } = game;
    ctx.fillText(`Level: ${level}`, 5, 23);
    ctx.fillText(`Score: ${score}`, canvas.width / 2 - 50, 23);
}

function drawLives() {
    if (game.lives > 2) { ctx.drawImage(images.heart, canvas.width - 110, -5, 40, 40); }
    if (game.lives > 1) { ctx.drawImage(images.heart, canvas.width - 80, -5, 40, 40); }
    if (game.lives > 0) { ctx.drawImage(images.heart, canvas.width - 50, -5, 40, 40); }
}

function detectCollision() {
    const hitTop = (ball) => ball.y < 0;
    const hitLeftWall = (ball) => ball.x < 0;
    const hitRightWall = (ball) => ball.x + ball.radius * 2 > canvas.width;
    const hitPaddle = (ball) =>
        ball.y + 2 * ball.radius > canvas.height - paddle.height &&
        ball.y + ball.radius < canvas.height &&
        ball.x + ball.radius > paddle.x &&
        ball.x + ball.radius < paddle.x + paddle.width;

    for (var i = 0; i < balls.length; i++) {
        if (hitLeftWall(balls[i])) {
            balls[i].dx = -balls[i].dx;
            balls[i].x = 0;
        }
        if (hitRightWall(balls[i])) {
            balls[i].dx = -balls[i].dx;
            balls[i].x = canvas.width - 2 * balls[i].radius;
        }
        if (hitTop(balls[i])) {
            balls[i].dy = -balls[i].dy;
            balls[i].y = 0;
        }
        if (hitPaddle(balls[i])) {
            balls[i].dy = -balls[i].dy;
            balls[i].y = canvas.height - paddle.height - 2 * balls[i].radius;
            game.sfx && sounds.paddle.play();
            // TODO change this logic to angles with sin/cos
            // Change x depending on where on the paddle the ball bounces.
            // Bouncing ball more on one side draws ball a little to that side.
            const drawingConst = 5
            const paddleMiddle = 2;
            const algo = (((balls[i].x - paddle.x) / paddle.width) * drawingConst);
            balls[i].dx = balls[i].dx + algo - paddleMiddle;
        }
    }
}

function detectBrickCollision() {
    let directionChanged = false;
    const isBallInsideBrick = (brick, ball) =>
        ball.x + 2 * ball.radius > brick.x &&
        ball.x < brick.x + brick.width && 
        ball.y + 2 * ball.radius > brick.y && 
        ball.y < brick.y + brick.height;

    for (var i = 0; i < balls.length; i++) {
        brickField.forEach((brick) => {
            if (brick.hitsLeft && isBallInsideBrick(brick, balls[i])) {
                makeBuff(brick.buff)
                sounds.brick.currentTime = 0;
                game.sfx && sounds.brick.play();
                brick.hitsLeft--;
                if (brick.hitsLeft === 1) {
                    brick.opacity = 0.5;
                }
                game.score += brick.points;

                if (!directionChanged) {
                    directionChanged = true;
                    detectCollisionDirection(brick, balls[i]);
                }
            }
        });
    }
}

function detectCollisionDirection(brick, ball) {
    const hitFromLeft = () => ball.x + 2 * ball.radius - ball.dx <= brick.x;
    const hitFromRight = () => ball.x - ball.dx >= brick.x + brick.width;

    if (hitFromLeft() || hitFromRight()) {
      ball.dx = -ball.dx;
    } else { // Hit from above or below
      ball.dy = -ball.dy;
    }
}

function keyDownHandler(e) {
    if (!game.on && e.key === ' ') {
        play();
    }
    if (game.on && (e.key === 'm' || e.key === 'M')) {
        game.music = !game.music;
        game.music ? sounds.music.play() : sounds.music.pause();
    }
    if (game.on && (e.key === 's' || e.key === 'S')) {
        game.sfx = !game.sfx;
    }
    if (e.key === 'ArrowUp') {
        volumeUp();
    }
    if (e.key === 'ArrowDown') {
        volumeDown();
    }
    if (e.key === 'ArrowRight') {
        game.rightKey = true;
    } else if (e.key === 'ArrowLeft') {
        game.leftKey = true;
    }
}

function keyUpHandler(e) {
    if (e.key === 'ArrowRight') {
        game.rightKey = false;
    } else if (e.key === 'ArrowLeft') {
        game.leftKey = false;
    }
}

function mouseMoveHandler(e) {
    const mouseX = e.clientX - canvas.offsetLeft;    
    const isInsideCourt = () => mouseX > 0 && mouseX < canvas.width;

    if(isInsideCourt()) {
        paddle.x = mouseX - paddle.width / 2;
    }
}

function isLevelCompleted() {
    const levelComplete = brickField.every((b) => b.hitsLeft === 0);

    if (levelComplete) {
        balls = [];
        initNextLevel();
        resetPaddle();
        resetBall();
        initBricks();
        game.timeoutId = setTimeout(() => {
            animate();
            sounds.music.play();
        }, 3000);

        return true;
    }
    return false;
}

function initNextLevel() {
    game.level++;
    game.speed++;
    sounds.music.pause();
    images.background.src = backgrounds[(game.level - 1) % 10];
    sounds.music.src = sounds_list[(game.level - 1) % 10];
    game.sfx && sounds.levelCompleted.play();
    ctx.font = '50px ArcadeClassic';
    ctx.fillStyle = 'yellow';
    ctx.fillText(`LEVEL ${game.level}!`, canvas.width / 2 - 80, canvas.height / 2);
}

function isGameOver() {
    const isAllBallsLost = () => balls.every(ball => ball.y - ball.radius > canvas.height);

    if (isAllBallsLost()) {
        game.lives -= 1;
        game.sfx && sounds.ballLost.play();
        if (game.lives === 0) {
            gameOver();
            return true;
        }
        resetPaddle();
        resetBall();
    }
    return false;
}

function gameOver() {
    game.on = false;
    sounds.music.pause();
    sounds.currentTime = 0;
    game.sfx && sounds.gameOver.play();
    ctx.font = '50px ArcadeClassic';
    ctx.fillStyle = 'red';
    ctx.fillText('GAME OVER', canvas.width / 2 - 100, canvas.height / 2);
}

function volumeDown() {
    if (sounds.music.volume >= 0.1) {
        for (const [key] of Object.entries(sounds)) {
            sounds[key].volume -= 0.1;
        }
    }
}


function volumeUp() {
    if (sounds.music.volume <= 0.9) {
        for (const [key] of Object.entries(sounds)) {
            sounds[key].volume += 0.1;
        }
    }
}

initSounds();
