let ww = window.innerWidth
|| document.documentElement.clientWidth
|| document.body.clientWidth;
let wh = window.innerHeight
|| document.documentElement.clientHeight
|| document.body.clientHeight;
let canvas = document.getElementById("canvas");
canvas.width = ww - 100;
canvas.height = wh - 100;
let ctx = canvas.getContext("2d");
let BB = canvas.getBoundingClientRect();
let offsetX = BB.left;
let offsetY = BB.top;
let WIDTH = canvas.width;
let HEIGHT = canvas.height;

let marginTop = 25;
let snapDistance = 10;

let dragok = false;
let startX;
let startY;
let initX;
let initY;


let rects = [];
for (let i = 0; i < randomIntFromInterval(4,8); i++) addRectangle();

function addRectangle() {
    rects.push({
        x: 0,
        y: 0,
        width: randomIntFromInterval(40,100),
        height: randomIntFromInterval(40,100),
        fill: '#' + Math.floor(Math.random() * 16777215).toString(16),
        isDragging: false,
        overlap: false
    })
}

function randomIntFromInterval(min,max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

canvas.onmousedown = myDown;
canvas.onmouseup = myUp;
canvas.onmousemove = myMove;

function rect(x, y, w, h) {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.closePath();
    ctx.fill();
}

function clear() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function draw(firstTime = 0) {
    clear();
    ctx.fillStyle = "#FAF7F8";
    rect(0, 0, WIDTH, HEIGHT);
    for (let r of rects) {
        if (r.overlap) ctx.fillStyle = "#FF0000";
        else ctx.fillStyle = r.fill;
        if (firstTime) {   
            let y = marginTop; 
            rect(25, y, r.width, r.height);
            r.x = 25;
            r.y = y;
            marginTop = y + r.height + 5;
        }
        else rect(r.x, r.y, r.width, r.height);
    }
}

function myDown(e) {
    e.preventDefault();
    e.stopPropagation();
    let mx = parseInt(e.clientX - offsetX);
    let my = parseInt(e.clientY - offsetY);
    dragok = false;
    for (let r of rects) {
        if (mx > r.x && mx < r.x + r.width && my > r.y && my < r.y + r.height) {
            dragok = true;
            r.isDragging = true;
            initX = r.x;
            initY = r.y;
            break;
        }
    }
    startX = mx;
    startY = my;
}

function myUp(e) { 
    e.preventDefault();
    e.stopPropagation();
    dragok = false;
    rects.forEach(finalize);
}

function finalize(r) {
    fillCheck(r);
    if (r.overlap && r.isDragging) { 
        r.x = initX;
        r.y = initY;
    }
    else if (r.isDragging) {
        let rectsToAvoid = [r];
        finalizeSnap(r, rectsToAvoid);
    }    
    fillCheck(r);
    r.overlap = false;
    r.isDragging = false;
    draw();
}

function fillCheck(r) {
    for (let r2 of rects) {
        if (r2 != r) {
            if (doOverlap(r, r2)) {
                r.overlap = true;
                r2.overlap = true;
            }
            else if (r.overlap && !r2.overlap) {
                continue;
            }
            else {
                r.overlap = false;
                r2.overlap = false;
            }
        };
    }
}

function doOverlap(r1, r2) {
    return !(r2.x + 1 > r1.x + r1.width || 
             r2.x + r2.width < r1.x + 1 || 
             r2.y + 1 > r1.y + r1.height ||
             r2.y + r2.height < r1.y + 1);      
}

function finalizeSnap(r, rectsToAvoid) {
    if (!isCloseToAnything(r)) return;
    for (let r2 of rects) { // SEARCH
        if (!rectsToAvoid.includes(r2) && getOppositeAxis(r, r2) && getSameAxis(r,r2)) { // SEARCH
            applySnap(r, r2); // SNAP
            if (doOthersOverlap(r, r2)) continue; // OTHERS OVERLAP -> GOTO SEARCH
            else return;
        }
    }
    r.x = initX;
    r.y = initY;
}

function isCloseToAnything(r) {
    let anythingSnaps = false;
    for (let r2 of rects) {
        if (getOppositeAxis(r, r2) && getSameAxis(r,r2)) {
            anythingSnaps = true;
            break;
        }
    }
    return anythingSnaps;
}

function applySnap(r1, r2) {
    let axisArr = [];
    axisArr.push(getOppositeAxis(r1,r2));
    axisArr.push(getSameAxis(r1,r2));
    let cArr = [];
    cArr.push(getCoordinate(r2, getOppositeAxis(r1,r2)));
    cArr.push(getCoordinate(r2, getSameAxis(r1,r2)));
    applyCoordinates(r1, axisArr, cArr);
}

function getOppositeAxis(r1, r2) {
    if (Math.abs(r2.x - (r1.x + r1.width)) < snapDistance) return ['x'];
    else if (Math.abs(r2.y - (r1.y + r1.height)) < snapDistance) return ['y'];
    else if (Math.abs(r1.x - (r2.x + r2.width)) < snapDistance) return ['x', 'width'];
    else if (Math.abs(r1.y - (r2.y + r2.height)) < snapDistance) return ['y', 'height'];
    else return null;
}

function getSameAxis(r1, r2) {
    if (Math.abs(r1.x - r2.x) < snapDistance) return ['x'];
    else if (Math.abs(r1.x + r1.width - r2.x - r2.width) < snapDistance) return ['x', 'width'];
    else if (Math.abs(r1.y - r2.y) < snapDistance) return ['y'];
    else if (Math.abs(r1.y + r1.height - r2.y - r2.height) < snapDistance) return ['y', 'height'];
    else return null;
}

function getCoordinate(r, axis) {
    let c = 0;
    for (let a of axis) c += r[a];
    return c;
}

function applyCoordinates(r, axisArr, cArr) {

    if (compare(axisArr[0], ["x", "width"])) r.x = cArr[0];
    else if (compare(axisArr[0], ["y", "height"])) r.y = cArr[0]; 
    else if (compare(axisArr[0], ["x"])) r.x = cArr[0] - r.width;
    else if (compare(axisArr[0], ["y"])) r.y = cArr[0] - r.height;
        
    if (compare(axisArr[1], ['x', 'width'])) r.x = cArr[1] - r.width;
    else if (compare(axisArr[1], ['y', 'height'])) r.y = cArr[1] - r.height;
    else if (compare(axisArr[1], ['x'])) r.x = cArr[1];
    else if (compare(axisArr[1], ['y'])) r.y = cArr[1];

}

function compare(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2); 
}

function myMove(e) {
    if (dragok) {
        e.preventDefault();
        e.stopPropagation();
        let mx = parseInt(e.clientX - offsetX);
        let my = parseInt(e.clientY - offsetY);
        let dx = mx - startX;
        let dy = my - startY;
        rects.forEach( r => {
            if (r.isDragging) {
                r.x += dx;
                r.y += dy;
                fillCheck(r);    
            }
        });
        draw();
        startX = mx;
        startY = my;
    }
}

function doOthersOverlap(r, r2) {
    for (let r3 of rects) if (r3 != r && r3 != r2 && doOverlap(r, r3)) return true;
    return false;
}

draw(1);