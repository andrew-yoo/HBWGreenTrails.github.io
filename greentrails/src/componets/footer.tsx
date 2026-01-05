import '../styles/style.css'
import React from 'react';
import Tree from './tree';
import FlowerCanvas from './flowers';

    const TreeFooter: React.FC = () => {
        return (
            <div>
                <div id='tree1'><Tree /></div>
                <div id='tree2'><Tree /></div>
                
                <footer>
                    <FlowerCanvas flowers={0} grass={200}>
                        <div id='road'></div>
                    </FlowerCanvas>
                </footer>
               
            </div>
        )
    }
    export const Regfooter: React.FC = () => {
        return (
            <div>
                <footer>
                    {/* <div id='road'></div> */}
                </footer>
                
            </div>
        )
    }
        export const Cloudfooter: React.FC = () => {
        return (
            <TreeFooter />
        )
    }

    export default TreeFooter;