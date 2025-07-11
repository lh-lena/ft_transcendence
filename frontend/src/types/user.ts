import { generateProfilePrint } from '../utils/generateProfilePrint';

export interface UserProfile {
    username: string;
    color: string;
    colorMap: string[];
}

const { color, colorMap } = generateProfilePrint(40, 40, 2);

export const userStore: UserProfile = {
    username: 'Alec',
    color: color,
    colorMap: colorMap
}