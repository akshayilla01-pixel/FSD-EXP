import express from "express";
import cors from "cors";
import morgan from "morgan";
import fs from "fs";
const app = express();
//third party mic
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
//application level middle ware
const logger = (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        const logMessage =
            `${req.method} ${req.url} ${res.statusCode} ${duration}ms\n`;
        fs.appendFile("server.log", logMessage, (err) => {
            if (err) {
                console.log("Failed to write to log file.");
            }
        });
    });
    next();
};
app.use(logger);
//Route specic
const validate = (req, res, next) => {
    const { name, age, ward } = req.body;
    if (!name || !age || !ward) {
        const err = new Error("Patient details missing");
        err.statusCode = 400;
        return next(err);
    }
    next();
};

app.post("/api/v1/patients", validate, (req, res) => {
    res.status(201).send("Patient record created successfully");
});

app.get("/api/v1/patients", (req, res) => {
    const ward = req.query.ward;
    if (ward) {
        res.status(200).send(`${ward} patient records fetched successfully`);
    } else {
        res.status(200).send("All patient records fetched successfully");
    }
});

app.get('/api/v1/patients/:id', (req, res) => {
    const patientId = parseInt(req.params.id);
    if(patientId){
        res.status(200).send(`Patient with ${patientId} fetched successfully`);
    }
    else{
        res.statusCode(404).send("Patient details not found");
    }
});

app.put("/api/v1/patients/:ward", (req, res) => {
    const id = req.params.ward;
    res.status(200).send(`Patient record with ID ${id} updated successfully`);
});

app.delete("/api/v1/patients/:id", (req, res) => {
    const id = req.params.id;
    res.status(200).send(`Patient record with ID ${id} deleted successfully`);
});

//Rest api or 404 middlWware
app.use((req, res) => {
    res.status(404).send("Page not found");
});
//Error handing
app.use((err, req, res, next) => {
    const errCode = err.statusCode || 500;
    const message = err.message || "Internal server error";
    res.status(errCode).send(message);
});

const PORT = 6500;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});