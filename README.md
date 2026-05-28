# Computer Science IA

###
<img width="622" height="59" alt="Screenshot 2026-05-25 at 8 54 14 PM" src="https://github.com/user-attachments/assets/8665276e-69f1-4d8c-a457-4e1eebf42b65" />

***all code, algorithms, architectures, diagrams and everything in between was made by Junyoung (Jun) Kim for Computer Science HL IBDP IA 2026-2027***


## Circuit Diagram
<img width="804" height="363" alt="Screenshot 2026-05-27 at 3 26 19 PM" src="https://github.com/user-attachments/assets/f49270ab-fde3-451d-98a6-610880c6e08b" />

## Reason Behind Product
During school sports day, students are not able to check the scores of each game unless they make a trip to the tent in the middle of the sports field. This is both time consuming and annoying for the students and teachers as students have to physically congregate at a single location to view results—creating a bottleneck of 500+ students. In order to solve this problem, it would be a good idea to have a digital platform where students are able to log on to in order to view the scoreboard without making a long trip to the tent and back.
A python based data changing/displaying web application that can be accessed through mobile devices or laptops. It will be based on an Anvil platform (a python based web development tool) and will be deployed using a GoDaddy DNS platform. The website will be programmed in Python using Anvil as the main compiler—any other necessary features needed that cannot be programmed with the Anvil platform will be coded using a native javascript file and added separately to the program. The data will be stored on a SQL-based PostgreSQL database that is changed in order to be compatible with Anvil. It will be able to let users log in (only needed in order to change data, not to view) and they will be able to change/read/write data regarding the sports day scores.

## Versions and Changes
| Version 1 | Version 2 | Version 3 | Version 4 |
| -------- | -------- | -------- | -------- |
| index.html | MongoDB database | html files (2) | gemini connection |
| supabase database| iceberg theme UI | server files (2) | enhanced database parsing |
| op.gg themed UI| node server local host | appscript web extract | clocked buffer for AI |
| python local host server | express js server file | ngrok http server | updated UI & database JSON file|
| js server file |  | real time update for sheet extractor | full stack development|


## How To Run Locally
1. clone the git repo
2. open terminal and type `cd server' OR make sure the terminal is currently in the server file
3. type `node server.js`
4. open a new terminal (keep the previous terminal open) and type `ngrok http 3000`
5. ngrok will provide a URL, click the url to go the directed webpage
6. open the `index.html` file locally
