<template>
    <div class="item-navigation">
        <button
            class="nav-button prev"
            :class="{ disabled: !prevId }"
            :disabled="!prevId || loading"
            @click="navigateTo(prevId)"
        >
            <v-icon name="chevron_left" />
            <span v-if="showLabels" class="label">{{ t('prev') }}</span>
        </button>

        <span class="position" v-if="position">
            {{ position.current }} / {{ position.total }}
        </span>

        <button
            class="nav-button next"
            :class="{ disabled: !nextId }"
            :disabled="!nextId || loading"
            @click="navigateTo(nextId)"
        >
            <span v-if="showLabels" class="label">{{ t('next') }}</span>
            <v-icon name="chevron_right" />
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
import { useRoute, useRouter } from 'vue-router';

interface Props {
    collection: string;
    primaryKey: string | number;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    showLabels?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    sortField: '',
    sortDirection: 'asc',
    showLabels: true,
});

const api = useApi();
const route = useRoute();
const router = useRouter();
const { useFieldsStore } = useStores();

const loading = ref(false);
const prevId = ref<string | number | null>(null);
const nextId = ref<string | number | null>(null);
const position = ref<{ current: number; total: number } | null>(null);

const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
        prev: { en: 'Prev', ru: 'Назад' },
        next: { en: 'Next', ru: 'Далее' },
    };
    const lang = navigator.language.startsWith('ru') ? 'ru' : 'en';
    return translations[key]?.[lang] || key;
};

const currentId = computed(() => {
    // Get ID from props or route
    if (props.primaryKey && props.primaryKey !== '+') {
        return props.primaryKey;
    }
    return route.params.primaryKey as string;
});

async function fetchNavigation() {
    if (!currentId.value || currentId.value === '+') {
        return;
    }

    loading.value = true;

    try {
        const fieldsStore = useFieldsStore();
        const fields = fieldsStore.getFieldsForCollection(props.collection);

        // Determine sort field
        let sortField = props.sortField;
        if (!sortField) {
            // Try to find sort field in collection
            const sortFieldObj = fields?.find((f: any) => f.field === 'sort');
            if (sortFieldObj) {
                sortField = 'sort';
            } else {
                // Fall back to primary key
                const pkField = fields?.find((f: any) => f.schema?.is_primary_key);
                sortField = pkField?.field || 'id';
            }
        }

        const direction = props.sortDirection || 'asc';

        // First, get total count and current item's sort value
        const currentResponse = await api.get(`/items/${props.collection}/${currentId.value}`, {
            params: { fields: ['id', sortField] },
        });

        const currentSortValue = currentResponse.data.data[sortField];

        // Get total count
        const countResponse = await api.get(`/items/${props.collection}`, {
            params: {
                aggregate: { count: '*' },
            },
        });
        const total = parseInt(countResponse.data.data[0]?.count || '0', 10);

        // Get previous item
        const prevOperator = direction === 'asc' ? '_lt' : '_gt';
        const prevSort = direction === 'asc' ? `-${sortField}` : sortField;

        const prevResponse = await api.get(`/items/${props.collection}`, {
            params: {
                filter: { [sortField]: { [prevOperator]: currentSortValue } },
                sort: [prevSort],
                limit: 1,
                fields: ['id'],
            },
        });
        prevId.value = prevResponse.data.data[0]?.id || null;

        // Get next item
        const nextOperator = direction === 'asc' ? '_gt' : '_lt';
        const nextSort = direction === 'asc' ? sortField : `-${sortField}`;

        const nextResponse = await api.get(`/items/${props.collection}`, {
            params: {
                filter: { [sortField]: { [nextOperator]: currentSortValue } },
                sort: [nextSort],
                limit: 1,
                fields: ['id'],
            },
        });
        nextId.value = nextResponse.data.data[0]?.id || null;

        // Calculate position
        const positionResponse = await api.get(`/items/${props.collection}`, {
            params: {
                filter: { [sortField]: { [prevOperator]: currentSortValue } },
                aggregate: { count: '*' },
            },
        });
        const beforeCount = parseInt(positionResponse.data.data[0]?.count || '0', 10);
        position.value = {
            current: direction === 'asc' ? beforeCount + 1 : total - beforeCount,
            total: total,
        };

    } catch (error) {
        console.error('Navigation fetch error:', error);
    } finally {
        loading.value = false;
    }
}

function navigateTo(id: string | number | null) {
    if (!id) return;
    router.push(`/content/${props.collection}/${id}`);
}

onMounted(() => {
    fetchNavigation();
});

watch(() => currentId.value, () => {
    fetchNavigation();
});
</script>

<style scoped>
.item-navigation {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
}

.nav-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border: 1px solid var(--theme--border-color);
    border-radius: var(--theme--border-radius);
    background: var(--theme--background);
    color: var(--theme--foreground);
    cursor: pointer;
    transition: all 0.15s ease;
    font-size: 14px;
}

.nav-button:hover:not(.disabled) {
    background: var(--theme--background-accent);
    border-color: var(--theme--primary);
}

.nav-button.disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.nav-button .label {
    font-weight: 500;
}

.position {
    color: var(--theme--foreground-subdued);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    min-width: 60px;
    text-align: center;
}

.nav-button.prev {
    padding-left: 8px;
}

.nav-button.next {
    padding-right: 8px;
}
</style>
