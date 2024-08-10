import React, { useEffect, useState } from 'react';
import { SpellingWords } from './wordList';

const synth = window.speechSynthesis;

const CompleteTimeout: number = 2000;

function speak(words: string) {
    if (synth.speaking) {
        console.error('speechSynthesis.speaking');
        return;
    }
    console.log(`Speak(${words})`);

    const utterThis = new SpeechSynthesisUtterance(words);
    utterThis.rate = 0.65;

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
    sentence: string;
    callback: GuessCompleteCB;
}

interface GuesserState {
    guess: string;
    complete: boolean;
    correct: boolean;
}

function Guesser({ target, sentence, callback }: GuesserProps) {
    let [guess, setGuess] = useState<GuesserState>({
        guess: '',
        correct: true,
        complete: false,
    });

    console.log(
        `Guesser guess=${guess.guess} complete=${guess.complete} correct=${guess.correct}`
    );

    const onKeyDown = (e: KeyboardEvent) => {
        e.preventDefault();
        console.log(`keydown ${e.key} state=${JSON.stringify(guess)}`);
        setGuess((g) => {
            if (g.complete) {
                return g;
            }
            const key = e.key;
            if (key == 'Backspace' && g.guess.length > 0) {
                const f = {
                    ...g,
                    guess: g.guess.substring(0, g.guess.length - 1),
                };
                console.log(`SetState ${JSON.stringify(f)}`);
                return f;
            } else if (
                key.length == 1 &&
                ((key.toLowerCase() >= 'a' && key.toLowerCase() <= 'z') ||
                    key == "'")
            ) {
                console.log(`setGuess g=${JSON.stringify(g)} key=${key}`);
                const complete = g.guess + key === target;
                const correct = g.correct && target.startsWith(g.guess + key);
                const f = {
                    guess: g.guess + key,
                    complete: complete,
                    correct: correct,
                };
                if (complete) {
                    callback(correct);
                }
                console.log(`SetState ${JSON.stringify(f)}`);
                return f;
            }
            return g;
        });
    };

    // On mount, attach keydown listener, and say the word to spell.
    useEffect(() => {
        window.addEventListener('keydown', onKeyDown);
        speak(sentence);
        return () => {
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

    const className =
        target.startsWith(guess.guess) && guess.guess.length > 0
            ? 'correct'
            : 'wrong';

    return (
        <div>
            <div id="guess" className={className}>
                {guess.guess}
            </div>
        </div>
    );
}

type SpellTestCompleteCB = () => void;

interface SpellTestProps {
    words: string[];
    callback: SpellTestCompleteCB;
}

enum TestProgress {
    Testing,
    NextTransition,
    Complete,
}

function split(s: string): [string, string] {
    const i = s.indexOf('...');
    if (i < 0) {
        return [s, ''];
    }
    const word = s.substring(0, i);
    return [word, s];
}

function SpellTest({ words, callback }: SpellTestProps) {
    const [targetIndex, setTargetIndex] = useState(0);
    const [complete, setComplete] = useState(false);
    const [state, setState] = useState<TestProgress>(TestProgress.Testing);
    const [numCorrect, setNumCorrect] = useState(0);
    const [numWrong, setNumWrong] = useState(0);

    const nextWordCallback = (correct: boolean) => {
        console.log('Callback correct:' + correct);
        if (correct) {
            setNumCorrect((n) => n + 1);
        } else {
            setNumWrong((n) => n + 1);
        }
        if (targetIndex + 1 === words.length) {
            // End of round.
            setState(TestProgress.Complete);
            setTimeout(callback, CompleteTimeout);
        } else {
            setState(TestProgress.NextTransition);
            setTargetIndex((i) => i + 1);
            setTimeout(() => setState(TestProgress.Testing), CompleteTimeout);
        }
    };

    const [target, sentence] = split(words[targetIndex]);

    console.log(`SpellTest.render() target=${target} sentence=${sentence}`);
    // Note: key={target} controls when React will re-render.
    switch (state) {
        case TestProgress.Testing:
            return (
                <div>
                    <button onClick={() => speak(target)}>Speak word</button>
                    <button onClick={() => speak(sentence)}>
                        Speak Sentence
                    </button>
                    <Guesser
                        target={target}
                        sentence={sentence}
                        callback={nextWordCallback}
                        key={target}
                    />
                </div>
            );
        case TestProgress.NextTransition:
            const [previous, _] = split(words[targetIndex - 1]);
            return (
                <div>
                    <div id="guess" className="correct">
                        {previous}
                    </div>
                    <div>Correct!</div>
                </div>
            );
        case TestProgress.Complete:
            return (
                <div>
                    Group complete! {numCorrect} of {numCorrect + numWrong}{' '}
                    correct!
                </div>
            );
    }
}

enum Screen {
    ChooseYearGroup,
    ChooseWordList,
    RunSpellTest,
}

export default function App() {
    const [state, setState] = useState<Screen>(Screen.ChooseYearGroup);
    const [year, setYear] = useState('');
    const chooseYear = (key: string) => {
        console.log(`ChooseYear ${key}`);
        setState(Screen.ChooseWordList);
        setYear(key);
    };
    const [words, setWords] = useState<string[]>([]);
    const chooseWordList = (wordList: string[]) => {
        console.log(`ChooseWordlist ${wordList}`);
        setState(Screen.RunSpellTest);
        setWords(wordList);
    };

    console.log(`App state=${state}`);

    if (state === Screen.ChooseYearGroup) {
        return (
            <div>
                <h1>Spell test</h1>
                <div>Select spelling year group:</div>
                {Object.keys(SpellingWords).map((key, index) => (
                    <div>
                        <button onClick={() => chooseYear(key)}>{key}</button>
                    </div>
                ))}
            </div>
        );
    } else if (state === Screen.ChooseWordList) {
        const listNames = Object.keys(SpellingWords[year]);
        return (
            <div>
                <h1>Spell test</h1>
                <div>Select word list:</div>
                {listNames.map((key, index) => (
                    <div>
                        <button
                            onClick={() =>
                                chooseWordList(SpellingWords[year][key])
                            }
                        >
                            {key}
                        </button>
                    </div>
                ))}
            </div>
        );
    } else if (state === Screen.RunSpellTest) {
        const callback = () => {
            setState(Screen.ChooseYearGroup);
        };
        return (
            <div>
                <h1>Spell test</h1>
                <div>
                    <SpellTest words={words} callback={callback} />
                </div>
            </div>
        );
    } else {
        <div>Unknown state</div>;
    }
}
