class CreatePlayers < ActiveRecord::Migration
  def self.up
    create_table :players do |t|
      t.integer :sit
      t.integer :stack
      t.integer :for_call, :default => 0
      t.integer :in_pot, :default => 0
      t.string :status
			t.boolean :act_in_this_round, :default => false
			t.boolean :want_pause, :default => false
      t.text :hand
      t.text :previous_hand
			t.integer :previous_win
      t.datetime :action_time
      t.datetime :control_action_time
			t.integer :place
      t.references :user
      t.references :game

      t.timestamps
    end
  end

  def self.down
    drop_table :players
  end
end
