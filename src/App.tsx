import React, { Component } from 'react';

const synth = window.speechSynthesis;

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

export class Guesser extends Component {
    constructor(props) {
        super(props);
        speak(props.target);
        this.state = {
            guess: '',
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
            key.toLowerCase() >= 'a' &&
            key.toLowerCase() <= 'z'
        ) {
            this.setState({ guess: this.state.guess + key });
        }
    }

    componentDidMount() {
        window.addEventListener('keydown', this.onKeyDown);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.onKeyDown);
    }

    render() {
        let chars = [];
        for (let i = 0; i < this.state.guess.length; i++) {
            const ch = this.state.guess[i];
            let t = i < this.props.target.length ? this.props.target[i] : '';
            let className = ch == t ? 'correct' : 'wrong';
            chars.push({ className: className, ch: ch });
        }
        return (
            <div className="guess">
                {chars.map((obj, i) => (
                    <span className={obj.className}>{obj.ch}</span>
                ))}
            </div>
        );
    }
}

export class SpellTest extends Component {
    constructor(props) {
        super(props);
        speak(props.target);
        this.state = {
            guess: '',
        };
    }

    render() {
        return <Guesser target={this.props.target} />;
    }
}

const words = ['one', 'two', 'three'];

export class App extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        const target = 'word';
        return (
            <div>
                <h1>Hello world from react!</h1>
                <div>
                    <button onClick={() => speak(target)}>Word</button>
                    <SpellTest target={target} />
                </div>
            </div>
        );
    }
}
