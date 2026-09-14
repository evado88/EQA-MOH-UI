import react, {useEffect, useState} from 'react';

interface TestComponentArges {
    title: string,
    linkClikced: () => void
}

export const TestComponent = ({title, linkClikced}: TestComponentArges) => {

    useEffect(() => {
        console.log('Component Test init');
    });
    
    return(<div>
        This is a component and you can click <a onClick={linkClikced}>{title == undefined ? '(no title)': title}</a>
    </div>)
}

