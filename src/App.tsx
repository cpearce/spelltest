import React, { useEffect, useState } from 'react';

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
    timeout: number;
}

function Guesser({ target, callback }: GuesserProps) {
    let [guess, setGuess] = useState<GuesserState>({
        guess: '',
        correct: true,
        complete: false,
        timeout: 0,
    });

    // const [complete, setComplete] = useState(false);
    // const [correct, setCorrect] = useState(true);
    // const [guess, setGuess] = useState('');

    console.log(
        `Guesser guess=${guess.guess} complete=${guess.complete} correct=${guess.correct}`
    );

    const onKeyDown = (e: KeyboardEvent) => {
        console.log(`keydown ${e.key} state=${JSON.stringify(guess)}`);
        setGuess((g) => {
            if (g.complete) {
                return g;
            }
            const key = e.key.toLowerCase();
            if (key == 'backspace' && guess.guess.length > 0) {
                const f = {
                    ...g,
                    guess: g.guess.substring(0, guess.guess.length - 1),
                };
                console.log(`SetState ${JSON.stringify(f)}`);
                return f;
            } else if (key.length == 1 && key >= 'a' && key <= 'z') {
                console.log(`setGuess g=${JSON.stringify(g)} key=${key}`);
                const complete = g.guess + key === target;
                const f = {
                    guess: g.guess + key,
                    complete: complete,
                    correct: g.correct && target.startsWith(g.guess),
                    timeout:
                        complete && g.timeout == 0
                            ? setTimeout(callback, CompleteTimeout)
                            : g.timeout,
                };
                console.log(`SetState ${JSON.stringify(f)}`);
                return f;
            }
            return g;
        });
    };

    useEffect(() => {
        console.log('Guesser.componentDidMount() Add keydown listener');
        window.addEventListener('keydown', onKeyDown);
        speak(target);

        return () => {
            console.log(
                'Guesser.componentWillUnmount() remove keydown listener'
            );
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [target]);

    let chars = [];
    for (let i = 0; i < guess.guess.length; i++) {
        const ch = guess.guess[i];
        let t = i < target.length ? target[i] : '';
        let className = ch == t ? 'correct' : 'wrong';
        chars.push({ className: className, ch: ch });
    }
    // todo render correct/not.
    // todo timeout to advance word.
    // Complete: <span>{guess.complete ? 'True' : 'False'}</span>

    return (
        <div>
            <div>Complete: {JSON.stringify(guess.complete)}</div>
            <div>Correct: {JSON.stringify(guess.correct)}</div>
            <div>Guess: {guess.guess}</div>
            <div className="guess">
                {chars.map((obj, i) => (
                    <span className={obj.className}>{obj.ch}</span>
                ))}
            </div>
        </div>
    );
}

interface SpellTestProps {
    words: string[];
}

function SpellTest({ words }: SpellTestProps) {
    const [targetIndex, setTargetIndex] = useState(0);

    const nextWordCallback = (correct: boolean) => {
        console.log('Callback correct:' + correct);
        if (targetIndex + 1 === words.length) {
            // End of round.
            console.log('TODO: End round');
        } else {
            console.log('Increment');
            setTargetIndex((i) => i + 1);
        }
    };

    const target = words[targetIndex];
    console.log(`SpellTest.render() target=${target}`);
    // Note: key={target} controls when React will re-render.
    return (
        <div>
            <Guesser target={target} callback={nextWordCallback} key={target} />
            <button onClick={() => speak(target)}>Word</button>
        </div>
    );
}

export default function App() {
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
