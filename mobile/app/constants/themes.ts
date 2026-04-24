import { ColorTheme } from '../../../shared/types';

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'forest',
    name: 'Forest',
    colors: ['#3B7A57', '#6B9E78', '#A8C5A0', '#2D5A45'],
    background: '#0D1A13',
    surface: '#1A2E1F',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: ['#1A6B8A', '#2E9BB5', '#5BC8D8', '#0D4D6E'],
    background: '#0A1520',
    surface: '#132030',
  },
  {
    id: 'ember',
    name: 'Ember',
    colors: ['#C0392B', '#E67E22', '#F1C40F', '#8E44AD'],
    background: '#1A0A08',
    surface: '#2A1510',
  },
  {
    id: 'slate',
    name: 'Slate',
    colors: ['#2C3E50', '#5D6D7E', '#85929E', '#1A252F'],
    background: '#0D1117',
    surface: '#161B22',
  },
  {
    id: 'blossom',
    name: 'Blossom',
    colors: ['#C0588A', '#E88FB0', '#9B59B6', '#7D3C98'],
    background: '#1A0D16',
    surface: '#2A1525',
  },
  {
    id: 'moss',
    name: 'Moss',
    colors: ['#556B2F', '#8FBC8F', '#6B8E23', '#3B5323'],
    background: '#0D1408',
    surface: '#182010',
  },
];

export const DEFAULT_THEME = COLOR_THEMES[0];
