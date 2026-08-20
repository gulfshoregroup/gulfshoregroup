function capitalizeFirstLetter(word: string) {
    const directions = ['ne', 'nw', 'se', 'sw', 'n', 's', 'e', 'w'];
    if (directions.includes(word.toLowerCase())) return word.toUpperCase();
    return word.charAt(0).toUpperCase() + word.slice(1);
}
export default function capitalizeWords(sentence: string) {
    if (!sentence) return '';
    sentence = sentence.trim().toLowerCase();
    return sentence.split(' ').map(word => capitalizeFirstLetter(word)).join(' ');
}