import type { Action } from 'svelte/action';

type VisualViewportPosition = {
	offsetTop?: number;
	pageTop?: number;
	containerTop?: number;
};

export const getVisualViewportTranslation = ({
	offsetTop,
	pageTop,
	containerTop
}: VisualViewportPosition) =>
	Math.max(
		0,
		...[offsetTop, pageTop, containerTop === undefined ? undefined : -containerTop].filter(
			(value): value is number => value !== undefined && Number.isFinite(value)
		)
	);

export const visualViewport: Action<HTMLElement, boolean> = (node, enabled) => {
	const viewport = window.visualViewport;
	let previousHeight = viewport?.height;
	let scrollFrame: number | undefined;

	const setRootScrollLock = (locked: boolean) => {
		document.documentElement.classList.toggle('visual-viewport-locked', locked);
		document.body.classList.toggle('visual-viewport-locked', locked);
	};

	const reset = () => {
		setRootScrollLock(false);
		node.style.removeProperty('--visual-viewport-height');
		node.style.removeProperty('--visual-viewport-top');
	};

	const update = () => {
		if (!viewport || !enabled) {
			return;
		}

		// Check before resizing the shell so the old viewport position is still measurable.
		const pinnedScrollers =
			viewport.scale === 1 && previousHeight !== undefined && viewport.height < previousHeight
				? [...node.querySelectorAll<HTMLElement>('[data-visual-viewport-scroll]')].filter(
						(element) => element.scrollHeight - element.scrollTop <= element.clientHeight + 5
					)
				: [];

		// pageTop includes layout viewport scrolling, while offsetTop only describes the
		// visual viewport's offset inside it. Recent WebKit versions can pan the rendered
		// document without updating either root scrollTop; the container rect catches that
		// third case. Use the largest signal so the app shell stays in the visible viewport.
		const top = getVisualViewportTranslation({
			offsetTop: viewport.offsetTop,
			pageTop: viewport.pageTop,
			containerTop: node.parentElement?.getBoundingClientRect().top
		});

		setRootScrollLock(true);
		node.style.setProperty('--visual-viewport-height', `${viewport.height}px`);
		node.style.setProperty('--visual-viewport-top', `${top}px`);
		previousHeight = viewport.height;

		if (pinnedScrollers.length > 0) {
			if (scrollFrame !== undefined) {
				cancelAnimationFrame(scrollFrame);
			}

			scrollFrame = requestAnimationFrame(() => {
				for (const element of pinnedScrollers) {
					element.scrollTop = element.scrollHeight;
				}
				scrollFrame = undefined;
			});
		}
	};

	update();
	viewport?.addEventListener('resize', update);
	viewport?.addEventListener('scroll', update);
	window.addEventListener('resize', update);
	window.addEventListener('scroll', update);

	return {
		update(value) {
			enabled = value;
			previousHeight = viewport?.height;

			if (enabled) {
				update();
			} else {
				reset();
			}
		},
		destroy() {
			viewport?.removeEventListener('resize', update);
			viewport?.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
			window.removeEventListener('scroll', update);
			if (scrollFrame !== undefined) {
				cancelAnimationFrame(scrollFrame);
			}
			reset();
		}
	};
};

export const preventVisualViewportScroll: Action<HTMLElement, boolean> = (node, enabled) => {
	const viewport = window.visualViewport;
	let isEnabled = enabled;

	const preventOuterScroll = (event: TouchEvent) => {
		const target = event.target;
		const layoutViewportHeight = document.documentElement.clientHeight;

		if (
			!isEnabled ||
			!viewport ||
			viewport.scale !== 1 ||
			Math.round(viewport.height) >= Math.round(layoutViewportHeight) ||
			!(target instanceof Element) ||
			target.closest('[data-visual-viewport-scroll]')
		) {
			return;
		}

		event.preventDefault();
		event.stopImmediatePropagation();
	};

	node.addEventListener('touchmove', preventOuterScroll, { capture: true, passive: false });

	return {
		update(value) {
			isEnabled = value;
		},
		destroy() {
			node.removeEventListener('touchmove', preventOuterScroll, { capture: true });
		}
	};
};
