<template>
	<div class="item-navigation">
		<button
			class="nav-button prev"
			:class="{ disabled: !prevId }"
			:disabled="!prevId || loading"
			@click="navigate(prevId)"
		>
			<v-icon name="chevron_left" />
			<span v-if="showLabels" class="label">{{ translate('prev') }}</span>
		</button>

		<span v-if="positionInfo" class="position">
			{{ positionInfo.current }} / {{ positionInfo.total }}
		</span>

		<button
			class="nav-button next"
			:class="{ disabled: !nextId }"
			:disabled="!nextId || loading"
			@click="navigate(nextId)"
		>
			<span v-if="showLabels" class="label">{{ translate('next') }}</span>
			<v-icon name="chevron_right" />
		</button>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useApi, useStores } from '@directus/extensions-sdk';
import { useRoute, useRouter } from 'vue-router';

const props = withDefaults(
	defineProps<{
		collection: string;
		primaryKey: string;
		sortField?: string;
		sortDirection?: string;
		showLabels?: boolean;
	}>(),
	{
		sortField: '',
		sortDirection: 'asc',
		showLabels: true,
	}
);

const api = useApi();
const route = useRoute();
const router = useRouter();
const { useFieldsStore } = useStores();

const loading = ref(false);
const prevId = ref<string | number | null>(null);
const nextId = ref<string | number | null>(null);
const positionInfo = ref<{ current: number; total: number } | null>(null);

// The bookmark id whose preset actually resolved for the current view, if any.
// Used by navigate() to write the context into the URL on Prev/Next, so a
// recovered context (see resolveActiveBookmarkId) becomes explicit and
// refresh-stable after the first navigation.
const activeBookmarkId = ref<string | null>(null);

/**
 * Extract a bookmark id from a URL/path IF it is this collection's browse view
 * (e.g. '/content/articles?bookmark=3' or 'https://host/admin/content/articles?bookmark=3').
 * Anything else — other collections, other origins, no bookmark — yields null.
 */
function bookmarkFromViewUrl(url: string | null | undefined): string | null {
	if (!url) return null;
	try {
		const parsed = new URL(url, window.location.origin);
		if (parsed.origin !== window.location.origin) return null;
		if (!parsed.pathname.endsWith(`/content/${props.collection}`)) return null;
		return parsed.searchParams.get('bookmark');
	} catch {
		return null;
	}
}

/**
 * Resolve the bookmark id of the view the user is actually working in.
 *
 * 1. `?bookmark=<id>` in the route — the explicit source (the app's browse→item
 *    guard carries it over on a normal row click).
 * 2. vue-router's `history.state.back` — the in-tab origin of this page. Covers
 *    entries where the URL query is missing, and survives a page refresh (the
 *    browser persists history entry state across reloads).
 * 3. `document.referrer` — ONLY when there is no in-tab history yet
 *    (`history.state.back == null`), i.e. this document is the tab's entry
 *    point: the item was ctrl/middle-clicked out of the bookmark view into a
 *    new tab, where neither the query nor history state exists. The referrer is
 *    also kept by browsers across reloads, so F5 in that tab stays in context.
 *    After any in-tab navigation the referrer goes stale (it never updates in
 *    an SPA), hence the guard.
 *
 * A recovered id is validated against the presets API by the caller exactly
 * like an explicit one (collection-guarded; stale/foreign ids fall through to
 * the default preset).
 */
function resolveActiveBookmarkId(): string | null {
	if (route.query.bookmark) return String(route.query.bookmark);

	const historyBack = typeof history.state?.back === 'string' ? history.state.back : null;

	const fromBack = bookmarkFromViewUrl(historyBack);
	if (fromBack) return fromBack;

	if (historyBack == null) {
		const fromReferrer = bookmarkFromViewUrl(document.referrer);
		if (fromReferrer) return fromReferrer;
	}

	return null;
}

const currentPrimaryKey = computed(() => {
	if (props.primaryKey && props.primaryKey !== '+') {
		return props.primaryKey;
	}
	return route.params.primaryKey as string;
});

const translate = (key: 'prev' | 'next') => {
	const lang = navigator.language.startsWith('ru') ? 'ru' : 'en';
	const translations = {
		prev: { en: 'Prev', ru: 'Назад' },
		next: { en: 'Next', ru: 'Далее' },
	};
	return translations[key][lang] || key;
};

async function fetchNavigation() {
	const currentId = currentPrimaryKey.value;
	if (!currentId || currentId === '+') {
		prevId.value = null;
		nextId.value = null;
		positionInfo.value = null;
		return;
	}

	loading.value = true;
	try {
		const fieldsStore = useFieldsStore();
		const fields = fieldsStore.getFieldsForCollection(props.collection) || [];
		
		const pkFieldObj = fields.find((f: any) => f.schema?.is_primary_key);
		const pkField = pkFieldObj?.field || 'id';

		// 1. Fetch current user ID to get their specific preset
		let currentUserId = null;
		try {
			const meRes = await api.get('/users/me', { params: { fields: ['id'] } });
			currentUserId = meRes.data?.data?.id;
		} catch (err) {
			console.warn('Could not fetch current user info:', err);
		}

		// 2. Resolve the ACTIVE preset for this view: when the item was opened from a
		// bookmark (?bookmark=<id> in the route, or recovered from the navigation
		// context — see resolveActiveBookmarkId), navigate that bookmark's view;
		// otherwise fall back to the user's/global default preset for the collection.
		// A stale or foreign bookmark id yields no row and falls through to the default.
		let activeSort: string[] = [];
		let activeFilter: any = null;
		let activeSearch: string | null = null;

		activeBookmarkId.value = null;

		try {
			let preset: any = null;

			const bookmarkId = resolveActiveBookmarkId();
			if (bookmarkId) {
				const bookmarkRes = await api.get('/presets', {
					params: {
						filter: {
							id: { _eq: bookmarkId },
							collection: { _eq: props.collection },
						},
					},
				});
				preset = bookmarkRes.data?.data?.[0] ?? null;
				if (preset) activeBookmarkId.value = bookmarkId;
			}

			if (!preset) {
				const presetParams: any = {
					filter: {
						collection: { _eq: props.collection },
						bookmark: { _null: true },
					},
				};
				if (currentUserId) {
					presetParams.filter.user = { _eq: currentUserId };
				}
				const presetRes = await api.get('/presets', { params: presetParams });
				preset = presetRes.data?.data?.[0] ?? null;
			}

			if (preset) {
				const layout = preset.layout || 'tabular';
				const layoutQuery = preset.layout_query?.[layout] || {};
				activeSort = layoutQuery.sort || [];
				activeFilter = preset.filter || null;
				activeSearch = preset.search || null;
			}
		} catch (err) {
			console.warn('Could not fetch preset:', err);
		}

		// 3. Determine sorting query based on active preset or fallback
		let sortQuery: string[] = [];
		if (activeSort && activeSort.length > 0) {
			sortQuery = [...activeSort];
			const primarySort = activeSort[0];
			const isDesc = primarySort.startsWith('-');
			if (!sortQuery.includes(pkField) && !sortQuery.includes(`-${pkField}`)) {
				sortQuery.push(isDesc ? `-${pkField}` : pkField);
			}
		} else {
			let sortField = props.sortField;
			if (!sortField) {
				if (fields.find((f: any) => f.field === 'sort')) {
					sortField = 'sort';
				} else {
					sortField = pkField;
				}
			}
			const dir = props.sortDirection || 'asc';
			sortQuery = dir === 'desc' ? [`-${sortField}`, `-${pkField}`] : [sortField, pkField];
		}

		// 4. Fetch total count using active preset filters/search
		const countParams: any = {};
		if (activeFilter) countParams.filter = activeFilter;
		if (activeSearch) countParams.search = activeSearch;

		const countRes = await api.get(`/items/${props.collection}`, {
			params: {
				...countParams,
				aggregate: { count: '*' },
			},
		});
		const totalCount = parseInt(countRes.data?.data?.[0]?.count || '0', 10);

		// If total count is small (e.g. < 5000), fetch all matching IDs in-memory
		if (totalCount < 5000) {
			const queryParams: any = {
				fields: [pkField],
				sort: sortQuery,
				limit: -1,
			};
			if (activeFilter) queryParams.filter = activeFilter;
			if (activeSearch) queryParams.search = activeSearch;

			const allIdsRes = await api.get(`/items/${props.collection}`, {
				params: queryParams,
			});

			const ids: (string | number)[] = (allIdsRes.data?.data || []).map((item: any) => item[pkField]);
			
			// Normalize current ID for lookup
			const parsedCurrentId = typeof ids[0] === 'number' ? Number(currentId) : String(currentId);
			const index = ids.indexOf(parsedCurrentId);

			if (index !== -1) {
				prevId.value = index > 0 ? ids[index - 1] : null;
				nextId.value = index < ids.length - 1 ? ids[index + 1] : null;
				positionInfo.value = {
					current: index + 1,
					total: ids.length,
				};
			} else {
				// Fallback if current item doesn't match active filters:
				// Load unfiltered IDs so navigation still functions
				const fallbackIdsRes = await api.get(`/items/${props.collection}`, {
					params: {
						fields: [pkField],
						sort: sortQuery,
						limit: -1,
					},
				});
				const fallbackIds: (string | number)[] = (fallbackIdsRes.data?.data || []).map((item: any) => item[pkField]);
				const fallbackIndex = fallbackIds.indexOf(parsedCurrentId);

				if (fallbackIndex !== -1) {
					prevId.value = fallbackIndex > 0 ? fallbackIds[fallbackIndex - 1] : null;
					nextId.value = fallbackIndex < fallbackIds.length - 1 ? fallbackIds[fallbackIndex + 1] : null;
					positionInfo.value = {
						current: fallbackIndex + 1,
						total: fallbackIds.length,
					};
				} else {
					prevId.value = null;
					nextId.value = null;
					positionInfo.value = {
						current: 1,
						total: totalCount || 1,
					};
				}
			}
		} else {
			// Fallback for large datasets: cursor-based pagination
			const primarySort = sortQuery[0] || pkField;
			const isDesc = primarySort.startsWith('-');
			const sortFieldName = isDesc ? primarySort.slice(1) : primarySort;
			const dir = isDesc ? 'desc' : 'asc';

			const currentItemRes = await api.get(`/items/${props.collection}/${currentId}`, {
				params: {
					fields: [pkField, sortFieldName],
				},
			});
			const currentSortVal = currentItemRes.data?.data?.[sortFieldName];

			const getNeighbor = async (isNext: boolean) => {
				const isAsc = dir === 'asc';
				const gtOperator = isAsc ? '_gt' : '_lt';
				const ltOperator = isAsc ? '_lt' : '_gt';
				const operator = isNext ? gtOperator : ltOperator;
				
				const neighborSortQuery = isNext
					? (isAsc ? [sortFieldName, pkField] : [`-${sortFieldName}`, `-${pkField}`])
					: (isAsc ? [`-${sortFieldName}`, `-${pkField}`] : [sortFieldName, pkField]);

				let neighborFilter: any = {};
				
				if (currentSortVal !== null && currentSortVal !== undefined) {
					neighborFilter = {
						_or: [
							{ [sortFieldName]: { [operator]: currentSortVal } },
							{
								_and: [
									{ [sortFieldName]: { _eq: currentSortVal } },
									{ [pkField]: { [isNext ? '_gt' : '_lt']: currentId } }
								]
							}
						]
					};
				} else {
					neighborFilter = {
						[sortFieldName]: { _null: true },
						[pkField]: { [isNext ? '_gt' : '_lt']: currentId }
					};
				}

				if (activeFilter) {
					neighborFilter = {
						_and: [activeFilter, neighborFilter],
					};
				}

				const res = await api.get(`/items/${props.collection}`, {
					params: {
						filter: neighborFilter,
						search: activeSearch || undefined,
						sort: neighborSortQuery,
						limit: 1,
						fields: [pkField],
					},
				});
				return res.data?.data?.[0]?.[pkField] || null;
			};

			prevId.value = await getNeighbor(false);
			nextId.value = await getNeighbor(true);

			let countFilter: any = {};
			if (currentSortVal !== null && currentSortVal !== undefined) {
				countFilter = {
					_or: [
						{ [sortFieldName]: { [dir === 'asc' ? '_lt' : '_gt']: currentSortVal } },
						{
							_and: [
								{ [sortFieldName]: { _eq: currentSortVal } },
								{ [pkField]: { _lt: currentId } }
							]
						}
					]
				};
			} else {
				countFilter = {
					[sortFieldName]: { _null: true },
					[pkField]: { _lt: currentId }
				};
			}

			if (activeFilter) {
				countFilter = {
					_and: [activeFilter, countFilter],
				};
			}

			const precedingRes = await api.get(`/items/${props.collection}`, {
				params: {
					filter: countFilter,
					search: activeSearch || undefined,
					aggregate: { count: '*' },
				},
			});
			const precedingCount = parseInt(precedingRes.data?.data?.[0]?.count || '0', 10);
			positionInfo.value = {
				current: precedingCount + 1,
				total: totalCount,
			};
		}
	} catch (err) {
		console.error('Navigation fetch error:', err);
		prevId.value = null;
		nextId.value = null;
		positionInfo.value = null;
	} finally {
		loading.value = false;
	}
}

function navigate(id: string | number | null) {
	if (id !== null && id !== undefined) {
		// Preserve the current view context (e.g. ?bookmark=<id>) across navigation.
		// When the bookmark was recovered from the navigation context rather than
		// the URL, write it into the query so the context becomes explicit —
		// shareable and refresh-stable — from the first Prev/Next on.
		const query: Record<string, any> = { ...route.query };
		if (activeBookmarkId.value && query.bookmark === undefined) {
			query.bookmark = activeBookmarkId.value;
		}

		router.push({ path: `/content/${props.collection}/${id}`, query });
	}
}

onMounted(() => {
	fetchNavigation();
});

watch(
	// Watch both current ID and route query parameters to detect view changes
	() => [currentPrimaryKey.value, route.query],
	() => {
		fetchNavigation();
	},
	{ deep: true }
);
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
