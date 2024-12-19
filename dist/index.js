"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.get('/', (req, res) => {
    res.send('hivvv');
});
app.post('/api/v1/signup', (req, res) => {
    console.log('post request to signup route');
});
app.post('/api/v1/signin', (req, res) => {
});
app.post('/api/v1/content', (req, res) => {
});
app.get('/api/v1/content', (req, res) => {
});
app.delete('/api/v1/content', (req, res) => {
});
app.post('/api/v1/brain/share', (req, res) => {
});
app.post('/api/v1/brain/:shareLink', (req, res) => {
});
app.listen(3000, () => console.log('server started at 3000'));
