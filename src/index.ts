import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';

export default defineInterface({
    id: 'item-navigation',
    name: 'Item Navigation',
    icon: 'swap_horiz',
    description: 'Prev/Next navigation buttons for items',
    component: InterfaceComponent,
    types: ['alias'],
    localTypes: ['presentation'],
    group: 'presentation',
    options: ({ collection }) => [
        {
            field: 'sortField',
            name: 'Sort Field',
            type: 'string',
            meta: {
                width: 'half',
                interface: 'system-field',
                options: {
                    collectionName: collection,
                    allowNone: true,
                    allowPrimaryKey: true,
                },
                note: 'Leave empty to auto-detect (sort → id)',
            },
            schema: {
                default_value: null,
            },
        },
        {
            field: 'sortDirection',
            name: 'Sort Direction',
            type: 'string',
            meta: {
                width: 'half',
                interface: 'select-dropdown',
                options: {
                    choices: [
                        { text: 'Ascending', value: 'asc' },
                        { text: 'Descending', value: 'desc' },
                    ],
                },
            },
            schema: {
                default_value: 'asc',
            },
        },
        {
            field: 'showLabels',
            name: 'Show Labels',
            type: 'boolean',
            meta: {
                width: 'half',
                interface: 'boolean',
                note: 'Show Prev/Next text on buttons',
            },
            schema: {
                default_value: true,
            },
        },
    ],
});
