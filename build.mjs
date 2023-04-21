import chokidar from 'chokidar';
import fs from 'fs-extra';

import {program} from "commander";

import {execSync, exec} from "child_process";

import chalk from 'chalk';

program.description("This script will do 2 thing: compile tailwindcss and compile org files to html");


function buildTailwind() {
    fs.mkdirpSync("dist", {recursive: true})
    console.log(chalk.blue('Tailwind ') + ' Building tailwind ...  ')
    console.time(chalk.blue("tailwind done"))
    execSync("npx tailwindcss build -i src/index.css -o dist/index.css", async (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);

        }
    })
    console.timeEnd(chalk.blue("tailwind done"))
}

/**
 * copy org file, htmlize.css, index.css to build dir, build org file in build dir to html
 */
function buildOrgFile() {

    fs.mkdirpSync("dist", {recursive: true})
    console.log(chalk.blue('Org ') + ' Building org files ...  ')
    console.time(chalk.blue("org done"))
    // copy main index file
    fs.copySync("src/index.org", "dist/index.org")
    // copy setup file
    fs.copySync("src/nhannht-theme.setup", "dist/nhannht-theme.setup")
    // copy htmlize.el
    fs.copySync("src/htmlize.el", "dist/htmlize.el")
    // copy et-book font
    fs.copySync("src/et-book", "dist/et-book")
    execSync("emacs --batch -f package-initialize -l ./dist/htmlize.el --visit dist/index.org -f org-html-export-to-html --kill",
        async (error, stdout, stderr) => {
            if (error) {
                await console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                await console.log(`stderr: ${stderr}`);
            }
        })
    console.timeEnd(chalk.blue("org done"))
}

function cleanDistDir() {
    console.log(chalk.blue('Clean ') + ' Cleaning dist directory ...  ')
    console.time(chalk.blue("clean done"))
    if (fs.pathExistsSync("dist")) {
        fs.removeSync("dist")
    }

    console.timeEnd(chalk.blue("clean done"))
}


// program.command("clean").action(cleanBuildDir).description("Clean build directory")
program
    .option("-t, --tailwind", "Build tailwindcss")
    .option("-m, --org", "Build org files")
    .option("-d, --dist", "Copy build to dist directory")
    .option("-f, --full", "Clean,Build tailwindcss and org files")
    .option("-w, --watch", "Watch for changes")
    .option("-c, --clean", "Clean dist directory")

program.parse(process.argv)
const options = program.opts();
if (options.cleandist) {
    cleanDistDir()
}
if (!options.watch) {
    if (options.tailwind) {
        buildTailwind()
    }
    if (options.org) {
        buildOrgFile()
    }
    if (options.full) {
        cleanDistDir()
        buildTailwind()
        buildOrgFile()
    }
} else {
    console.log(chalk.red(' Watching for changes ...'));
    chokidar.watch(['src/**/*'], {ignored: /(^|[\/\\])\../})
        .on('all', async (event, path) => {
            if (path.endsWith(".org")) {
                console.log("Org file changed")
                await buildOrgFile()

            } else if (path.endsWith("tufte.css")) {
                console.log("Tufte file changed")
                fs.copySync("src/tufte.css", "dist/tufte.css")
            }

            else if (path.endsWith(".css")) {
                console.log("Tailwind file changed")
                await buildTailwind()
            } else if (path.endsWith(".setup")) {
                console.log("Org setup file changed")
                await buildOrgFile()
            } else {
                console.log("File " + path + " is not org nor tailwind related file , just copy to dist")
                const path_without_src = await path.replace("src/", "")
                fs.copySync(path, "dist/" + path_without_src)
            }
        });
}





