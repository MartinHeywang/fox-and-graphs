# Math problem : Fox and graphs

This problem comes from a math event : *Math En Jeans* (fr), where classes of volunteers from high schools solve an unsolved problem during a whole class year.

## The problem

"A fox walks through its burrow. It contains multiple holes.
Each day, he moves from his hole to an adjacent one.
Each day, we can check a hole to see if he is there."

1. The burrow consists of 5 holes, arranged in one single line. Can we find the fox for sure ? If yes, in how many days?
1. What if the burrow contains a different number of holes (still arranged inline). How many days are required to find the fox in burrow containing 42.069 holes?
1. What if the holes and arranged in a circle?
1. And what if the burrow is arranged as a graph? (whether it contains cycles or not)

## What this repo contains

This repo is a simple web application : it is a simulator that help us find the answer to the various questions, especially the last one.
We can create holes, click on them to see what would happen if the fox was in that hole, and find out what techniques work well, and which do not.

## How to launch the simulator

First, make sure you have [NodeJS](https://nodejs.org) installed. Then, clone this repo using `git` or download the projet using the green button, then put the projet where you want it to live.
Then, type the following commands at the root of the project:

```bash
npm install # install the dependencies
npm run dev # launch the server
# your browser should then open automatically
```

Controls:

- double-click to create a new node,
- move a node by holding on the text and dragging
- link nodes by dragging from the dark-orange part of any node
- simple-click on the light-orange part to simulate a day
