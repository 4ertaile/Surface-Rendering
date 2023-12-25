'use strict';

let gl;        // webgl context.
let surface;   // surface model
let shProgram; // shader program
let spaceball; // SimpleRotator 
let line;
let point;
let pointCoords = [0.5, 0.5]

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iNormalBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices, normals, textures) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STREAM_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textures), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }

    this.Draw = function () {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexture, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexture);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}

// Constructor
function ShaderProgram(name, program) {
    this.name = name;
    this.prog = program;

    this.iAttribVertex = -1;
    this.iAttribNormal = -1;
    this.iColor = -1;
    this.iModelViewProjectionMatrix = -1;
    this.iNormalMat = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}

function draw() {
    let b_red = document.getElementById('b_red').value
    let b_green = document.getElementById('b_green').value
    let b_blue = document.getElementById('b_blue').value
    gl.clearColor(b_red, b_green, b_blue, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let fov = Math.PI / 4;
    let aspectRatio = 1;
    let near = 1;
    let far = 50;
    let projection = m4.perspective(fov, aspectRatio, near, far);

    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(-2, -1, -10);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    let modelViewProjection = m4.multiply(projection, matAccum1);
    const normalMat = m4.identity();
    m4.inverse(modelView, normalMat);
    m4.transpose(normalMat, normalMat);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iNormalMat, false, normalMat);


    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
    let m_red = document.getElementById('m_red').value
    let m_green = document.getElementById('m_green').value
    let m_blue = document.getElementById('m_blue').value
    gl.uniform3fv(shProgram.iDiffuseColor, [m_red, m_green, m_blue]);
    gl.uniform2fv(shProgram.iPointCoords, pointCoords);
    gl.uniform1f(shProgram.iAngle, document.getElementById('a').value);

    surface.Draw();
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(modelViewProjection,
        m4.translation(...cassiniVertex(pointCoords[0], map(pointCoords[1], 0, 1, -5, 5)))));
    gl.uniform1f(shProgram.iAngle, -100.0);
    point.Draw();
}
const c = 5
const H = 1
const a = 0.033 * Math.PI
const fi = 0
const p = 8 * Math.PI
let omega = 0

const { cos, sin, sqrt, pow, PI } = Math
function CreateSurfaceData() {
    let vertexList = [];
    const MAX_U = 1,
        MAX_V = 5,
        STEP_U = 0.01,
        STEP_V = 0.2
    for (let u = 0; u <= MAX_U; u += STEP_U) {
        for (let v = -5; v <= MAX_V; v += STEP_V) {
            let vertex = cassiniVertex(u, v)
            vertexList.push(...vertex)
            vertex = cassiniVertex(u + STEP_U, v)
            vertexList.push(...vertex)
            vertex = cassiniVertex(u, v + STEP_V)
            vertexList.push(...vertex)
            vertexList.push(...vertex)
            vertex = cassiniVertex(u + STEP_U, v)
            vertexList.push(...vertex)
            vertex = cassiniVertex(u + STEP_U, v + STEP_V)
            vertexList.push(...vertex)
        }
    }
    return vertexList;
}

const scaler = 1;

function cassiniVertex(u, v) {
    omega = p * u
    let x = (c * u + v * (Math.sin(fi) + Math.tan(a) * Math.cos(fi) * Math.cos(omega))),


        y = (v * Math.tan(a) * Math.sin(omega)),


        cV = (H + v * (Math.tan(a) * Math.sin(fi) * Math.cos(omega) - Math.cos(fi)));


    return [scaler * x, scaler * y, scaler * cV];
}

function CreateNormals() {
    let normalList = [];
    const MAX_U = 1,
        MAX_V = 5,
        STEP_U = 0.01,
        STEP_V = 0.2
    omega = 0
    for (let u = 0; u <= MAX_U; u += STEP_U) {
        for (let v = -5; v <= MAX_V; v += STEP_V) {
            let vertex = normalAnalytic(u, v)
            normalList.push(...vertex)
            vertex = normalAnalytic(u + STEP_U, v)
            normalList.push(...vertex)
            vertex = normalAnalytic(u, v + STEP_V)
            normalList.push(...vertex)
            normalList.push(...vertex)
            vertex = normalAnalytic(u + STEP_U, v)
            normalList.push(...vertex)
            vertex = normalAnalytic(u + STEP_U, v + STEP_V)
            normalList.push(...vertex)
        }
    }
    return normalList;
}

const e = 0.001

function normalAnalytic(u, v) {
    let u1 = cassiniVertex(u, v),
        u2 = cassiniVertex(u + e, v),
        v1 = cassiniVertex(u, v),
        v2 = cassiniVertex(u, v + e);
    const dU = [], dV = []
    for (let i = 0; i < 3; i++) {
        dU.push((u1[i] - u2[i]) / e)
        dV.push((v1[i] - v2[i]) / e)
    }
    const n = m4.normalize(m4.cross(dU, dV))
    return n
}

function CreateTextures() {
    let textureList = []
    const MAX_U = 1,
        MAX_V = 5,
        STEP_U = 0.01,
        STEP_V = 0.2
    omega = 0
    for (let u = 0; u <= MAX_U; u += STEP_U) {
        for (let v = -5; v <= MAX_V; v += STEP_V) {
            textureList.push(u, map(v, -5, MAX_V, 0, 1))
            textureList.push(u + STEP_U, map(v, -5, MAX_V, 0, 1))
            textureList.push(u, map(v + STEP_V, -5, MAX_V, 0, 1))
            textureList.push(u, map(v + STEP_V, -5, MAX_V, 0, 1))
            textureList.push(u + STEP_U, map(v, -5, MAX_V, 0, 1))
            textureList.push(u + STEP_U, map(v + STEP_V, -5, MAX_V, 0, 1))
        }
    }
    return textureList;
}
function map(value, a, b, c, d) {
    value = (value - a) / (b - a);
    return c + value * (d - c);
}
const r = 0.2
function CreateSphereVertices(step = 0.15) {
    let vertexList = [];

    let u = 0,
        v = 0;
    while (u < Math.PI * 2) {
        while (v < Math.PI) {

            let v1 = getSpheVertex(u, v, r);
            let v2 = getSpheVertex(u + step, v, r);
            let v3 = getSpheVertex(u, v + step, r);
            let v4 = getSpheVertex(u + step, v + step, r);


            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            v += step;
        }
        v = 0;
        u += step;
    }
    return vertexList;
}
function getSpheVertex(long, lat, r) {
    return {
        x:   Math.sin(lat) * Math.cos(long) * r,
        y:   Math.sin(lat) * Math.sin(long) * r,
        z:   Math.cos(lat) * r
    }
}

function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iAttribTexture = gl.getAttribLocation(prog, "texture");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iNormalMat = gl.getUniformLocation(prog, "normalMat");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iDiffuseColor = gl.getUniformLocation(prog, "diffuseColor");
    shProgram.iPointCoords = gl.getUniformLocation(prog, "textureTranslation");
    shProgram.iAngle = gl.getUniformLocation(prog, "angle");

    surface = new Model('Surface');
    surface.BufferData(CreateSurfaceData(), CreateNormals(), CreateTextures());
    let svs = CreateSphereVertices()
    point = new Model()
    point.BufferData(svs, svs, svs)
    gl.enable(gl.DEPTH_TEST);
}

function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

function init() {
    document.getElementById('b_red').onchange = (e) => {
        draw()
    }
    document.getElementById('b_green').onchange = (e) => {
        draw()
    }
    document.getElementById('b_blue').onchange = (e) => {
        draw()
    }
    document.getElementById('m_red').onchange = (e) => {
        draw()
    }
    document.getElementById('m_green').onchange = (e) => {
        draw()
    }
    document.getElementById('m_blue').onchange = (e) => {
        draw()
    }
    document.getElementById('a').onchange = (e) => {
        draw()
    }
    window.onkeydown = (e) => {
        if (e.keyCode == 87) {
            pointCoords[0] = Math.min(pointCoords[0] + 0.02, 1);
        }
        else if (e.keyCode == 65) {
            pointCoords[1] = Math.max(pointCoords[1] - 0.02, 0);
        }
        else if (e.keyCode == 83) {
            pointCoords[0] = Math.max(pointCoords[0] - 0.02, 0);
        }
        else if (e.keyCode == 68) {
            pointCoords[1] = Math.min(pointCoords[1] + 0.02, 1);
        }
        draw()
    }

    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        LoadTexture();
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);

    draw();
}//save

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "";//my git picture
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        draw()
    }
}