const toHumanReadableTime = t => {
    if (t === null) {
        return '-';
    }

    if (Number.isInteger(t)) {
        return toHumanReadableTime(new Date(t));
    }

    if (!(t instanceof Date)) {
        throw new Error('Assertion error');
    }

    const min = t.getMinutes();
    const sec = t.getSeconds();
    const ms = t.getMilliseconds();
    let formatted = min.toString().length < 2 ? `0${min}:` : `${min}:`;
    formatted += sec.toString().length < 2 ? `0${sec}:` : `${sec}:`;
    switch (ms.toString().length) {
        case 3:
            formatted += ms;
            break;
        case 2:
            formatted += `0${ms}`;
            break;
        case 1:
            formatted += `00${ms}`;
            break;
        default:
            formatted += ms;
    }

    return formatted;
};

module.exports = {
    toHumanReadableTime,
};
