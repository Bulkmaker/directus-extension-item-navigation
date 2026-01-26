import { defineInterface } from '@directus/extensions-sdk';
import InterfaceComponent from './interface.vue';
import { t } from './i18n';

export default defineInterface({
    id: 'item-navigation',
    name: t('interfaceName'),
    icon: 'swap_horiz',
    description: t('interfaceDescription'),
    component: InterfaceComponent,
    types: ['alias'],
    localTypes: ['presentation'],
    group: 'presentation',
    options: ({ collection }) => [
        {
            field: 'sortField',
            name: t('sortFieldLabel'),
            type: 'string',
            meta: {
                width: 'half',
                interface: 'system-field',
                options: {
                    collectionName: collection,
                    allowNone: true,
                    allowPrimaryKey: true,
                },
                note: t('sortFieldNote'),
            },
            schema: {
                default_value: null,
            },
        },
        {
            field: 'sortDirection',
            name: t('sortDirectionLabel'),
            type: 'string',
            meta: {
                width: 'half',
                interface: 'select-dropdown',
                options: {
                    choices: [
                        { text: t('directionAscending'), value: 'asc' },
                        { text: t('directionDescending'), value: 'desc' },
                    ],
                },
            },
            schema: {
                default_value: 'asc',
            },
        },
        {
            field: 'showLabels',
            name: t('showLabelsLabel'),
            type: 'boolean',
            meta: {
                width: 'half',
                interface: 'boolean',
                note: t('showLabelsNote'),
            },
            schema: {
                default_value: true,
            },
        },
    ],
});
