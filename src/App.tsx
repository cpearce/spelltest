import React, { Component, useState } from 'react';

const synth = window.speechSynthesis;

const CompleteTimeout: number = 2000;

function speak(words: string) {
    if (synth.speaking) {
        console.error('speechSynthesis.speaking');
        return;
    }

    const utterThis = new SpeechSynthesisUtterance(words);

    utterThis.onend = function (event) {
        console.log('SpeechSynthesisUtterance.onend');
    };

    utterThis.onerror = function (event) {
        console.error('SpeechSynthesisUtterance.onerror');
    };

    synth.speak(utterThis);
}

type GuessCompleteCB = (correct: boolean) => void;

interface GuesserProps {
    target: string;
    callback: GuessCompleteCB;
}

interface GuesserState {
    guess: string;
    complete: boolean;
    correct: boolean;
}

export class Guesser extends Component<GuesserProps, GuesserState> {
    constructor(props: GuesserProps) {
        super(props);
        console.log('Guesser.render() target=' + props.target);
        speak(props.target);
        this.state = {
            guess: '',
            complete: false,
            correct: true,
        };
        this.onKeyDown = this.onKeyDown.bind(this);
    }

    onKeyDown(e: KeyboardEvent) {
        console.log(`keydown ${e.key}`);
        const key = e.key.toLowerCase();
        if (key == 'backspace' && this.state.guess.length > 0) {
            this.setState({
                guess: this.state.guess.substring(
                    0,
                    this.state.guess.length - 1
                ),
            });
        } else if (
            key.length == 1 &&
            key >= 'a' &&
            key <= 'z' &&
            !this.state.complete
        ) {
            const guess = this.state.guess + key;
            const complete = guess === this.props.target;
            const correct =
                this.state.correct && this.props.target.startsWith(guess);
            if (complete) {
                console.log('Complete: ' + guess);
                setTimeout(() => this.props.callback(correct), CompleteTimeout);
            }
            this.setState({
                guess: guess,
                complete: complete,
                correct: correct,
            });
        }
    }

    componentDidMount() {
        console.log('Guesser.componentDidMount() Add keydown listener');
        window.addEventListener('keydown', this.onKeyDown);
    }

    componentWillUnmount() {
        console.log('Guesser.componentWillUnmount() remove keydown listener');
        window.removeEventListener('keydown', this.onKeyDown);
    }

    render() {
        console.log('Guesser.render()');

        let chars = [];
        for (let i = 0; i < this.state.guess.length; i++) {
            const ch = this.state.guess[i];
            let t = i < this.props.target.length ? this.props.target[i] : '';
            let className = ch == t ? 'correct' : 'wrong';
            chars.push({ className: className, ch: ch });
        }
        // todo render correct/not.
        // todo timeout to advance word.
        return (
            <div className="guess">
                {chars.map((obj, i) => (
                    <span className={obj.className}>{obj.ch}</span>
                ))}
            </div>
        );
    }
}

interface SpellTestProps {
    words: string[];
}

interface SpellTestState {
    targetIndex: number;
}

export class SpellTest extends Component<SpellTestProps, SpellTestState> {
    constructor(props: SpellTestProps) {
        super(props);
        this.state = {
            targetIndex: 0,
        };
        this.nextWordCallback = this.nextWordCallback.bind(this);
    }

    nextWordCallback(correct: boolean) {
        console.log('Callback correct:' + correct);
        if (this.state.targetIndex + 1 === this.props.words.length) {
            // End of round.
            console.log('TODO: End round');
        } else {
            console.log('Increment');
            this.setState({
                targetIndex: this.state.targetIndex + 1,
            });
        }
    }

    render() {
        const target = this.props.words[this.state.targetIndex];
        console.log(`SpellTest.render() target=${target}`);
        return (
            <div>
                <Guesser target={target} callback={this.nextWordCallback} />
                <button onClick={() => speak(target)}>Word</button>
            </div>
        );
    }
}

export class App extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        const words = ['one', 'two', 'three'];
        return (
            <div>
                <h1>Hello world from react!</h1>
                <div>
                    <SpellTest words={words} />
                </div>
            </div>
        );
    }
}
